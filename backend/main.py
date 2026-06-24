"""FastAPI entry point for the Faculty CMS backend.

The app exposes three groups of endpoints:
  * /api/auth/*    — login + current user
  * /api/public/*  — read-only, called by the public website (no auth)
  * /api/admin/*   — full CRUD, requires Bearer JWT

It also serves uploaded files at /uploads, the admin SPA at /admin and the
public static website at the root "/" (index.html, about.html, assets, …) —
all from the same Railway service.

Run locally:
    pip install -r requirements.txt
    export JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(48))")
    export INITIAL_ADMIN_PASSWORD=changeme
    uvicorn backend.main:app --reload --port 8001
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from html import escape as html_escape

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import Page
from .routes import admin as admin_routes
from .routes import auth as auth_routes
from .routes import public as public_routes
from .seed import ensure_initial_admin, init_db, seed_dynamic_blocks


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_initial_admin()
    seed_dynamic_blocks()
    yield


settings = get_settings()
app = FastAPI(title="Факультет ИИ — CMS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({*settings.FRONTEND_ORIGINS, *settings.ADMIN_ORIGINS}),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_routes.router)
app.include_router(public_routes.router)
app.include_router(admin_routes.router)


# Static files: uploaded user content (read by both admin + public site).
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/shared/tile-registry.js", include_in_schema=False)
def shared_tile_registry() -> FileResponse:
    """Single source of truth for the page/tile registry; consumed by the
    admin SPA so we don't keep a duplicate copy under admin/."""
    return FileResponse(
        settings.PROJECT_ROOT / "tile-registry.js",
        media_type="application/javascript",
    )


# ---------------------------------------------------------------------------
# Live preview of the public site, served from the *admin* host.
#
# The visual editor (admin SPA) loads the real public pages into an <iframe>.
# Serving them from the same origin as the admin lets the editor read and
# decorate the page's DOM directly (no cross-origin restrictions), so the
# admin can click any text on the live site and edit it in place.
#
# Only front-end assets are exposed — never backend sources, the database,
# dotfiles (.env, .git) or anything outside the project root.
# ---------------------------------------------------------------------------
_PREVIEW_ALLOWED_SUFFIXES = {
    ".html", ".htm", ".css", ".js", ".mjs", ".map", ".json",
    ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico",
    ".woff", ".woff2", ".ttf", ".otf",
}
_PREVIEW_BLOCKED_TOP_DIRS = {"backend", "admin"}

# Injected into preview HTML so the embedded page talks to *this* host's API
# and so script.js knows it is running inside the editor (edit mode).
_PREVIEW_INJECT = (
    "<script>window.FII_API_BASE=window.location.origin;"
    "window.__FII_PREVIEW__=true;</script>"
)


@app.get("/preview/{path:path}", include_in_schema=False)
def preview_file(path: str):
    root = settings.PROJECT_ROOT
    rel = path or "index.html"
    if rel.endswith("/"):
        rel = rel + "index.html"

    target = (root / rel).resolve()

    # Stay strictly inside the project root (defeats ../ traversal).
    try:
        parts = target.relative_to(root).parts
    except ValueError:
        raise HTTPException(status_code=404)

    if (
        not parts
        or any(p.startswith(".") for p in parts)        # hidden files/dirs (.env, .git)
        or parts[0] in _PREVIEW_BLOCKED_TOP_DIRS         # backend sources, admin SPA
        or not target.is_file()
        or target.suffix.lower() not in _PREVIEW_ALLOWED_SUFFIXES
    ):
        raise HTTPException(status_code=404)

    if target.suffix.lower() in {".html", ".htm"}:
        html = target.read_text(encoding="utf-8")
        if "</head>" in html:
            html = html.replace("</head>", _PREVIEW_INJECT + "</head>", 1)
        else:
            html = _PREVIEW_INJECT + html
        return HTMLResponse(html)

    return FileResponse(target)


# ---------------------------------------------------------------------------
# Admin-created pages — served from a single shared HTML shell (page.html).
#
# These pages have no static file of their own: their whole content is built
# from dynamic blocks/sections and rendered client-side by script.js. The shell
# is served with the page's key injected so the front-end knows which content
# to load. `?preview=1` adds the editor injection for the admin iframe.
# Registered before the catch-all static mount so it isn't shadowed.
# ---------------------------------------------------------------------------
@app.get("/p/{key}", include_in_schema=False)
def dynamic_page(
    key: str, db: Session = Depends(get_db), preview: int = 0,
) -> HTMLResponse:
    page = db.scalar(select(Page).where(Page.key == key))
    if not page:
        raise HTTPException(status_code=404)
    doc = (settings.PROJECT_ROOT / "page.html").read_text(encoding="utf-8")
    doc = doc.replace("__PAGE_TITLE__", html_escape(page.title))
    inject = f"<script>window.__FII_PAGE_KEY__={json.dumps(key)};</script>"
    if preview:
        inject += _PREVIEW_INJECT
    doc = doc.replace("</head>", inject + "</head>", 1) if "</head>" in doc else inject + doc
    return HTMLResponse(doc)


# Admin SPA — served from the same host as the API at /admin/*.
# Entry point is /admin/login.html (there is no shortcut on "/").
if settings.ADMIN_STATIC_DIR.exists():
    app.mount("/admin", StaticFiles(directory=settings.ADMIN_STATIC_DIR, html=True), name="admin")


@app.get("/healthz", include_in_schema=False)
def healthz() -> dict:
    return {"ok": True}


# ---------------------------------------------------------------------------
# Public website — served at the root "/" from the project root.
#
# IMPORTANT: this catch-all mount MUST stay LAST. A StaticFiles mount on "/"
# matches every path, so it has to be registered after /api/*, /admin,
# /uploads, /preview, /shared and /healthz — otherwise it would shadow them.
#
# backend/ sources, the admin SPA (already served at /admin) and dotfiles
# (.env, .git, …) are hidden so the catch-all can never leak them.
# ---------------------------------------------------------------------------
class PublicSiteStaticFiles(StaticFiles):
    _BLOCKED_TOP_DIRS = {"backend", "admin"}

    async def get_response(self, path: str, scope):
        parts = [p for p in path.split("/") if p and p != "."]
        if parts and (
            parts[0] in self._BLOCKED_TOP_DIRS
            or any(p.startswith(".") for p in parts)
        ):
            raise HTTPException(status_code=404)
        return await super().get_response(path, scope)


app.mount("/", PublicSiteStaticFiles(directory=settings.PROJECT_ROOT, html=True), name="public")
