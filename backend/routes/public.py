"""Read-only endpoints for the public website. No authentication."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..config import get_settings
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
) -> Response:
    """Log one public page view. Called by script.js — только после того, как
    пользователь согласился на аналитику (см. initPrivacyConsent в script.js).

    No auth — anyone can record their own visit. Минимизация данных (ч. 5 ст. 5
    152-ФЗ): IP-адрес не сохраняем, User-Agent не сохраняем (в статистике он не
    используется). Для метрики уникальных посетителей достаточно созданного на
    клиенте идентификатора сессии.
    """
    db.add(PageView(
        page_key=payload.page_key,
        path=payload.path[:500],
        referrer=(payload.referrer or None) and payload.referrer[:500],
        session_id=payload.session_id[:64],
    ))
    db.commit()
    _purge_expired_views(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Чистку запускаем не чаще раза в час — она попутная, отдельный планировщик
# ради неё разворачивать не нужно.
_last_purge_at: datetime | None = None
_PURGE_INTERVAL = timedelta(hours=1)


def _purge_expired_views(db: Session) -> None:
    """Удаляет просмотры старше срока хранения (ч. 7 ст. 5 152-ФЗ)."""
    global _last_purge_at

    now = datetime.now(timezone.utc)
    if _last_purge_at is not None and now - _last_purge_at < _PURGE_INTERVAL:
        return
    _last_purge_at = now

    retention_days = get_settings().ANALYTICS_RETENTION_DAYS
    if retention_days <= 0:
        return

    cutoff = now.replace(tzinfo=None) - timedelta(days=retention_days)
    try:
        db.execute(delete(PageView).where(PageView.created_at < cutoff))
        db.commit()
    except Exception:
        # Просмотр уже записан — сбой уборки не должен ломать ответ пользователю.
        db.rollback()
