"""Authenticated CRUD endpoints for the CMS admin panel."""

from __future__ import annotations

import shutil
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Optional
from urllib.parse import urlparse

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import get_settings
from ..database import engine, get_db
from ..models import BlockField, DynamicBlock, News, Page, PageView, Photo, TickerItem, TileVisibility, User
from ..schemas import (
    AnalyticsBucket,
    AnalyticsRow,
    AnalyticsSummary,
    BlockFieldIn,
    BlockFieldOut,
    DynamicBlockBulkIn,
    DynamicBlockCreateIn,
    DynamicBlockOut,
    DynamicBlockUpdateIn,
    NewsOut,
    NewsStatus,
    PageCreateIn,
    PageOut,
    PhotoOut,
    PhotoUpdateIn,
    TickerReplaceIn,
    TileVisibilityIn,
    TileVisibilityOut,
)

# Page keys that already belong to the built-in static site / shared tiles —
# admin-created pages must not reuse them (their content would collide).
_RESERVED_PAGE_KEYS = {
    "index", "about", "achievements", "news", "reviews", "admission", "grant", "_shared",
}

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_user)])


# ---------- Helpers -------------------------------------------------------

def _upsert_dialect():
    """Pick the right `INSERT ... ON CONFLICT` flavour."""
    name = engine.dialect.name
    if name == "postgresql":
        return pg_insert
    return sqlite_insert  # SQLite (default)


def _save_upload(file: UploadFile, subdir: str) -> str:
    s = get_settings()
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in s.ALLOWED_IMAGE_EXTS:
        raise HTTPException(415, f"Недопустимый формат файла: {suffix or '?'}")

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > s.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл слишком большой")

    target_dir = s.UPLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    dest = target_dir / name
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"/uploads/{subdir}/{name}"


# ---------- Blocks --------------------------------------------------------

@router.get("/blocks", response_model=list[BlockFieldOut])
def list_blocks(db: Annotated[Session, Depends(get_db)]) -> list[BlockField]:
    return list(db.scalars(select(BlockField)))


@router.put("/blocks", response_model=BlockFieldOut)
def upsert_block(payload: BlockFieldIn, db: Annotated[Session, Depends(get_db)]) -> BlockField:
    insert = _upsert_dialect()
    stmt = (
        insert(BlockField)
        .values(
            page_key=payload.page_key,
            tile_id=payload.tile_id,
            field_id=payload.field_id,
            value=payload.value,
        )
        .returning(BlockField)
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["page_key", "tile_id", "field_id"],
        set_={"value": payload.value, "updated_at": datetime.utcnow()},
    )
    row = db.execute(stmt).scalar_one()
    db.commit()
    db.refresh(row)
    return row


@router.delete("/blocks", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_block(
    page_key: str,
    tile_id: str,
    db: Annotated[Session, Depends(get_db)],
    field_id: str | None = None,
) -> Response:
    stmt = delete(BlockField).where(
        BlockField.page_key == page_key, BlockField.tile_id == tile_id,
    )
    if field_id is not None:
        stmt = stmt.where(BlockField.field_id == field_id)
    db.execute(stmt)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/blocks/all", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def reset_all_blocks(db: Annotated[Session, Depends(get_db)]) -> Response:
    db.execute(delete(BlockField))
    db.execute(delete(TileVisibility))
    db.execute(delete(DynamicBlock))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Dynamic blocks (admin-added repeatable items) -----------------

@router.get("/blocks/dynamic", response_model=list[DynamicBlockOut])
def list_dynamic_blocks(db: Annotated[Session, Depends(get_db)]) -> list[DynamicBlock]:
    return list(
        db.scalars(
            select(DynamicBlock).order_by(
                DynamicBlock.page_key, DynamicBlock.list_id, DynamicBlock.position, DynamicBlock.id,
            )
        )
    )


@router.post("/blocks/dynamic", response_model=DynamicBlockOut, status_code=status.HTTP_201_CREATED)
def create_dynamic_block(
    payload: DynamicBlockCreateIn, db: Annotated[Session, Depends(get_db)],
) -> DynamicBlock:
    position = payload.position
    if position is None:
        current_max = db.scalar(
            select(func.max(DynamicBlock.position)).where(
                DynamicBlock.page_key == payload.page_key,
                DynamicBlock.list_id == payload.list_id,
            )
        )
        position = (current_max or 0) + 1

    tile_id = f"{payload.template_id}-{uuid.uuid4().hex[:8]}"
    block = DynamicBlock(
        page_key=payload.page_key,
        list_id=payload.list_id,
        tile_id=tile_id,
        template_id=payload.template_id,
        position=position,
    )
    db.add(block)
    # Seed the initial field values (typically the template defaults) so the new
    # block has content before the admin edits it.
    for field_id, value in payload.fields.items():
        db.add(BlockField(
            page_key=payload.page_key, tile_id=tile_id, field_id=field_id, value=value,
        ))
    db.commit()
    db.refresh(block)
    return block


@router.post(
    "/blocks/dynamic/bulk", response_model=list[DynamicBlockOut], status_code=status.HTTP_201_CREATED,
)
def bulk_create_dynamic_blocks(
    payload: DynamicBlockBulkIn, db: Annotated[Session, Depends(get_db)],
) -> list[DynamicBlock]:
    """Adopt a list's existing static items as managed blocks.

    Refuses (409) if the list already has blocks, so calling it again — e.g. from
    a second admin tab — can't duplicate the page's content.
    """
    existing = db.scalar(
        select(DynamicBlock).where(
            DynamicBlock.page_key == payload.page_key,
            DynamicBlock.list_id == payload.list_id,
        ).limit(1)
    )
    if existing:
        raise HTTPException(409, "Список уже переведён в управляемый")

    created: list[DynamicBlock] = []
    for i, item in enumerate(payload.items, start=1):
        tile_id = f"{payload.template_id}-{uuid.uuid4().hex[:8]}"
        block = DynamicBlock(
            page_key=payload.page_key,
            list_id=payload.list_id,
            tile_id=tile_id,
            template_id=payload.template_id,
            position=i,
        )
        db.add(block)
        for field_id, value in item.fields.items():
            db.add(BlockField(
                page_key=payload.page_key, tile_id=tile_id, field_id=field_id, value=value,
            ))
        created.append(block)
    db.commit()
    for b in created:
        db.refresh(b)
    return created


@router.patch("/blocks/dynamic/{tile_id}", response_model=DynamicBlockOut)
def update_dynamic_block(
    tile_id: str,
    page_key: str,
    payload: DynamicBlockUpdateIn,
    db: Annotated[Session, Depends(get_db)],
) -> DynamicBlock:
    block = db.scalar(
        select(DynamicBlock).where(
            DynamicBlock.page_key == page_key, DynamicBlock.tile_id == tile_id,
        )
    )
    if not block:
        raise HTTPException(404, "Блок не найден")
    if payload.position is not None:
        block.position = payload.position
    db.commit()
    db.refresh(block)
    return block


@router.delete(
    "/blocks/dynamic/{tile_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response,
)
def delete_dynamic_block(
    tile_id: str, page_key: str, db: Annotated[Session, Depends(get_db)],
) -> Response:
    db.execute(
        delete(DynamicBlock).where(
            DynamicBlock.page_key == page_key, DynamicBlock.tile_id == tile_id,
        )
    )
    # Drop the block's content and visibility flag along with it.
    db.execute(
        delete(BlockField).where(
            BlockField.page_key == page_key, BlockField.tile_id == tile_id,
        )
    )
    db.execute(
        delete(TileVisibility).where(
            TileVisibility.page_key == page_key, TileVisibility.tile_id == tile_id,
        )
    )
    # If this is a section, cascade-delete the cards nested inside it
    # (their list_id is "<section tile_id>__items").
    child_list_id = f"{tile_id}__items"
    child_tile_ids = list(db.scalars(
        select(DynamicBlock.tile_id).where(
            DynamicBlock.page_key == page_key, DynamicBlock.list_id == child_list_id,
        )
    ))
    if child_tile_ids:
        db.execute(delete(DynamicBlock).where(
            DynamicBlock.page_key == page_key, DynamicBlock.list_id == child_list_id,
        ))
        db.execute(delete(BlockField).where(
            BlockField.page_key == page_key, BlockField.tile_id.in_(child_tile_ids),
        ))
        db.execute(delete(TileVisibility).where(
            TileVisibility.page_key == page_key, TileVisibility.tile_id.in_(child_tile_ids),
        ))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Visibility ----------------------------------------------------

@router.get("/visibility", response_model=list[TileVisibilityOut])
def list_visibility(db: Annotated[Session, Depends(get_db)]) -> list[TileVisibility]:
    return list(db.scalars(select(TileVisibility)))


@router.put("/visibility", response_model=TileVisibilityOut)
def upsert_visibility(
    payload: TileVisibilityIn, db: Annotated[Session, Depends(get_db)],
) -> TileVisibility:
    insert = _upsert_dialect()
    stmt = (
        insert(TileVisibility)
        .values(
            page_key=payload.page_key,
            tile_id=payload.tile_id,
            is_visible=payload.is_visible,
        )
        .returning(TileVisibility)
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["page_key", "tile_id"],
        set_={"is_visible": payload.is_visible, "updated_at": datetime.utcnow()},
    )
    row = db.execute(stmt).scalar_one()
    db.commit()
    db.refresh(row)
    return row


# ---------- Ticker --------------------------------------------------------

@router.get("/ticker", response_model=list[str])
def list_ticker(db: Annotated[Session, Depends(get_db)]) -> list[str]:
    return [r.text for r in db.scalars(select(TickerItem).order_by(TickerItem.position, TickerItem.id))]


@router.put("/ticker", response_model=list[str])
def replace_ticker(
    payload: TickerReplaceIn, db: Annotated[Session, Depends(get_db)],
) -> list[str]:
    db.execute(delete(TickerItem))
    for pos, text in enumerate(payload.items):
        text = text.strip()
        if text:
            db.add(TickerItem(text=text, position=pos))
    db.commit()
    return [r.text for r in db.scalars(select(TickerItem).order_by(TickerItem.position, TickerItem.id))]


# ---------- News ----------------------------------------------------------

@router.get("/news", response_model=list[NewsOut])
def list_news(db: Annotated[Session, Depends(get_db)]) -> list[News]:
    return list(db.scalars(select(News).order_by(News.created_at.desc())))


@router.post("/news", response_model=NewsOut, status_code=status.HTTP_201_CREATED)
async def create_news(
    db: Annotated[Session, Depends(get_db)],
    title:        str = Form(..., min_length=1, max_length=255),
    content:      str = Form(""),
    publish_date: Optional[str] = Form(None),
    status_:      NewsStatus = Form("draft", alias="status"),
    cover:        Optional[UploadFile] = File(None),
) -> News:
    cover_url: str | None = None
    if cover is not None and cover.filename:
        cover_url = _save_upload(cover, "news")

    pd = datetime.fromisoformat(publish_date) if publish_date else None
    news = News(
        title=title.strip(),
        content=content,
        publish_date=pd,
        status=status_,
        cover_url=cover_url,
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return news


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_news(news_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    n = db.get(News, news_id)
    if not n:
        raise HTTPException(404, "Новость не найдена")
    db.delete(n)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Photos --------------------------------------------------------

@router.get("/photos", response_model=list[PhotoOut])
def list_photos(db: Annotated[Session, Depends(get_db)]) -> list[Photo]:
    return list(db.scalars(select(Photo).order_by(Photo.uploaded_at.desc())))


@router.post("/photos", response_model=list[PhotoOut], status_code=status.HTTP_201_CREATED)
async def upload_photos(
    db: Annotated[Session, Depends(get_db)],
    files: list[UploadFile] = File(...),
    caption: Optional[str] = Form(None),
) -> list[Photo]:
    created: list[Photo] = []
    for f in files:
        if not f.filename:
            continue
        url = _save_upload(f, "photos")
        photo = Photo(url=url, original_name=f.filename, caption=caption)
        db.add(photo)
        created.append(photo)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


@router.patch("/photos/{photo_id}", response_model=PhotoOut)
def update_photo(
    photo_id: int,
    payload: PhotoUpdateIn,
    db: Annotated[Session, Depends(get_db)],
) -> Photo:
    p = db.get(Photo, photo_id)
    if not p:
        raise HTTPException(404, "Фото не найдено")
    if payload.caption is not None:
        p.caption = payload.caption
    db.commit()
    db.refresh(p)
    return p


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_photo(photo_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    p = db.get(Photo, photo_id)
    if not p:
        raise HTTPException(404, "Фото не найдено")
    try:
        path = get_settings().PROJECT_ROOT / "backend" / p.url.lstrip("/")
        if path.exists():
            path.unlink()
    except OSError:
        pass
    db.delete(p)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Pages (admin-created) -----------------------------------------

@router.get("/pages", response_model=list[PageOut])
def list_pages(db: Annotated[Session, Depends(get_db)]) -> list[Page]:
    return list(db.scalars(select(Page).order_by(Page.position, Page.id)))


@router.post("/pages", response_model=PageOut, status_code=status.HTTP_201_CREATED)
def create_page(payload: PageCreateIn, db: Annotated[Session, Depends(get_db)]) -> Page:
    if payload.key in _RESERVED_PAGE_KEYS:
        raise HTTPException(409, "Этот адрес зарезервирован, выберите другой")
    if db.scalar(select(Page).where(Page.key == payload.key)):
        raise HTTPException(409, "Страница с таким адресом уже существует")
    current_max = db.scalar(select(func.max(Page.position)))
    page = Page(key=payload.key, title=payload.title.strip(), position=(current_max or 0) + 1)
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.delete("/pages/{key}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_page(key: str, db: Annotated[Session, Depends(get_db)]) -> Response:
    page = db.scalar(select(Page).where(Page.key == key))
    if not page:
        raise HTTPException(404, "Страница не найдена")
    # Remove the page and all of its content (blocks, fields, visibility).
    db.execute(delete(DynamicBlock).where(DynamicBlock.page_key == key))
    db.execute(delete(BlockField).where(BlockField.page_key == key))
    db.execute(delete(TileVisibility).where(TileVisibility.page_key == key))
    db.delete(page)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Uploads for inline use (e.g. attaching to a block) ------------

@router.post("/uploads/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    _user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> dict:
    if not file.filename:
        raise HTTPException(400, "Файл не передан")
    url = _save_upload(file, "blocks")
    return {"url": url, "original_name": file.filename}


# ---------- Analytics -----------------------------------------------------

def _referrer_label(ref: str | None) -> str:
    """Normalise a Referer header into a short, human-readable source label."""
    if not ref:
        return "Прямой переход"
    try:
        host = urlparse(ref).hostname or ""
    except ValueError:
        return "Прямой переход"
    if not host:
        return "Прямой переход"
    host = host.lower().removeprefix("www.")
    return host


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(
    db: Annotated[Session, Depends(get_db)], days: int = 14,
) -> AnalyticsSummary:
    """Aggregated stats for the admin dashboard.

    `days` controls only the daily time series (default 14). Totals always
    cover the full table; the 7d/30d/today buckets are computed on top of
    rows fetched within a single window (= max(days, 30)).
    """
    days = max(1, min(days, 90))
    now = datetime.utcnow()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    window_days = max(days, 30)
    window_start = start_of_today - timedelta(days=window_days - 1)

    # All-time totals — one round-trip each, cheap on the small page_views table.
    total_views = db.scalar(select(func.count(PageView.id))) or 0
    total_sessions = db.scalar(select(func.count(func.distinct(PageView.session_id)))) or 0

    # One scan over the recent window powers every recency-based metric below.
    rows = list(
        db.execute(
            select(PageView.page_key, PageView.referrer, PageView.session_id, PageView.created_at)
            .where(PageView.created_at >= window_start)
        )
    )

    by_day_views: dict[str, int] = defaultdict(int)
    by_day_sessions: dict[str, set[str]] = defaultdict(set)
    page_views: dict[str, int] = defaultdict(int)
    page_sessions: dict[str, set[str]] = defaultdict(set)
    ref_views: dict[str, int] = defaultdict(int)
    ref_sessions: dict[str, set[str]] = defaultdict(set)
    views_today = 0
    sessions_today_set: set[str] = set()
    views_7d = 0
    sessions_7d_set: set[str] = set()
    views_30d = 0
    sessions_30d_set: set[str] = set()
    seven_days_ago = start_of_today - timedelta(days=6)   # last 7 days incl. today

    for page_key, referrer, session_id, created_at in rows:
        day = created_at.date().isoformat()
        by_day_views[day] += 1
        by_day_sessions[day].add(session_id)

        page_label = page_key or "—"
        page_views[page_label] += 1
        page_sessions[page_label].add(session_id)

        ref_label = _referrer_label(referrer)
        ref_views[ref_label] += 1
        ref_sessions[ref_label].add(session_id)

        if created_at >= start_of_today:
            views_today += 1
            sessions_today_set.add(session_id)
        if created_at >= seven_days_ago:
            views_7d += 1
            sessions_7d_set.add(session_id)
        views_30d += 1
        sessions_30d_set.add(session_id)

    # Continuous time series — fill missing days with zeros so the chart is gap-free.
    daily: list[AnalyticsBucket] = []
    first_day = start_of_today - timedelta(days=days - 1)
    for i in range(days):
        d = (first_day + timedelta(days=i)).date().isoformat()
        daily.append(AnalyticsBucket(
            label=d,
            views=by_day_views.get(d, 0),
            sessions=len(by_day_sessions.get(d, set())),
        ))

    def _top(views: dict[str, int], sessions: dict[str, set[str]], limit: int = 10) -> list[AnalyticsRow]:
        items = [
            AnalyticsRow(label=k, views=v, sessions=len(sessions.get(k, set())))
            for k, v in views.items()
        ]
        items.sort(key=lambda r: r.views, reverse=True)
        return items[:limit]

    return AnalyticsSummary(
        total_views=total_views,
        total_sessions=total_sessions,
        views_today=views_today,
        sessions_today=len(sessions_today_set),
        views_7d=views_7d,
        sessions_7d=len(sessions_7d_set),
        views_30d=views_30d,
        sessions_30d=len(sessions_30d_set),
        daily=daily,
        top_pages=_top(page_views, page_sessions),
        top_referrers=_top(ref_views, ref_sessions),
    )
