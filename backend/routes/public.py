"""Read-only endpoints for the public website. No authentication."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BlockField, DynamicBlock, News, Page, PageView, Photo, TickerItem, TileVisibility
from ..schemas import DynamicBlockOut, NewsOut, PageOut, PageViewIn, PhotoOut, PublicOverridesOut

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/overrides", response_model=PublicOverridesOut)
def get_overrides(page_key: str, db: Annotated[Session, Depends(get_db)]) -> PublicOverridesOut:
    """Snapshot for one page: text overrides + visibility + ticker."""
    content: dict[str, dict[str, str]] = {}
    for row in db.scalars(select(BlockField).where(BlockField.page_key == page_key)):
        content.setdefault(row.tile_id, {})[row.field_id] = row.value

    visibility: dict[str, bool] = {}
    for row in db.scalars(select(TileVisibility).where(TileVisibility.page_key == page_key)):
        visibility[row.tile_id] = row.is_visible

    ticker = [r.text for r in db.scalars(select(TickerItem).order_by(TickerItem.position, TickerItem.id))]

    blocks = [
        DynamicBlockOut.model_validate(b)
        for b in db.scalars(
            select(DynamicBlock)
            .where(DynamicBlock.page_key == page_key)
            .order_by(DynamicBlock.list_id, DynamicBlock.position, DynamicBlock.id)
        )
    ]

    return PublicOverridesOut(
        page_key=page_key,
        content=content,
        visibility=visibility,
        ticker=ticker,
        blocks=blocks,
    )


@router.get("/news", response_model=list[NewsOut])
def list_published_news(db: Annotated[Session, Depends(get_db)]) -> list[News]:
    return list(
        db.scalars(
            select(News).where(News.status == "published").order_by(News.publish_date.desc().nullslast(), News.id.desc())
        )
    )


@router.get("/photos", response_model=list[PhotoOut])
def list_photos(db: Annotated[Session, Depends(get_db)]) -> list[Photo]:
    return list(db.scalars(select(Photo).order_by(Photo.uploaded_at.desc())))


@router.get("/pages", response_model=list[PageOut])
def list_pages(db: Annotated[Session, Depends(get_db)]) -> list[Page]:
    """Admin-created pages — drives the site nav and the admin sidebar."""
    return list(db.scalars(select(Page).order_by(Page.position, Page.id)))


@router.post("/track", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def track_view(
    payload: PageViewIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_agent: Annotated[str | None, Header(alias="user-agent")] = None,
) -> Response:
    """Log one public page view. Called by script.js on every page load.

    No auth — anyone can record their own visit. We don't store IPs (privacy);
    the client-generated session id alone backs the "unique visitors" metric.
    """
    db.add(PageView(
        page_key=payload.page_key,
        path=payload.path[:500],
        referrer=(payload.referrer or None) and payload.referrer[:500],
        session_id=payload.session_id[:64],
        user_agent=user_agent[:500] if user_agent else None,
    ))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
