"""One-shot helpers: create tables, seed initial admin user."""

from __future__ import annotations

import secrets

from sqlalchemy import select

from .auth import hash_password
from .config import get_settings
from .database import Base, SessionLocal, engine
from .models import BlockField, DynamicBlock, User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


# Initial reviews for the "Отзывы" page. They are seeded as dynamic blocks so
# the page looks identical to the static markup, but every review can be edited,
# added or removed from the admin panel. Re-seeding is idempotent (stable
# tile_ids, skipped once any review block exists).
_REVIEWS_SEED = [
    {"avatar": "АК", "name": "Анна Климова", "role": "3 курс · ИИ и МО",
     "text": "Здесь не просто учат программировать — тебя реально погружают в науку. "
             "На втором курсе я уже работала над проектом с Яндексом."},
    {"avatar": "ДМ", "name": "Дмитрий Морозов", "role": "Выпускник 2025",
     "text": "Факультет дал не только хард-скиллы, но и сообщество — хакатоны, "
             "митапы, стартап-инкубатор. Сейчас работаю ML-инженером в Сбере."},
    {"avatar": "ЕС", "name": "Елена Сидорова", "role": "2 курс · Робототехника",
     "text": "Думала, ИИ — что-то далёкое и сложное. А на первом курсе мы "
             "собирали роботов и учили их распознавать объекты."},
    {"avatar": "ИП", "name": "Игорь Петров", "role": "4 курс · Компьютерное зрение",
     "text": "Преподаватели — практикующие исследователи, а не просто лекторы. "
             "Любой вопрос можно разобрать на семинаре до самого конца."},
    {"avatar": "МН", "name": "Мария Нгуен", "role": "Магистратура · NLP",
     "text": "Приехала по обмену и осталась в магистратуре. Международная среда "
             "и сильная научная база — то, чего мне не хватало дома."},
    {"avatar": "СВ", "name": "Сергей Волков", "role": "Преподаватель · Deep Learning",
     "text": "Веду здесь курс по глубокому обучению и вижу, как студенты за год "
             "проходят путь от первой модели до публикации на конференции."},
]


def seed_dynamic_blocks() -> None:
    """Populate the reviews page with its starter blocks on first run."""
    with SessionLocal() as db:
        already = db.scalar(
            select(DynamicBlock).where(DynamicBlock.page_key == "reviews").limit(1)
        )
        if already:
            return

        for i, review in enumerate(_REVIEWS_SEED, start=1):
            tile_id = f"review-card-seed{i}"
            db.add(DynamicBlock(
                page_key="reviews",
                list_id="reviews-grid",
                tile_id=tile_id,
                template_id="review-card",
                position=i,
            ))
            for field_id, value in review.items():
                db.add(BlockField(
                    page_key="reviews", tile_id=tile_id, field_id=field_id, value=value,
                ))
        db.commit()


def ensure_initial_admin() -> None:
    """Create the seed admin user if no users exist yet.

    If INITIAL_ADMIN_PASSWORD is not set, generate a random one and print it
    to stdout once — copy it from the deploy logs.
    """
    s = get_settings()
    with SessionLocal() as db:
        exists = db.scalar(select(User).limit(1))
        if exists:
            return

        password = s.INITIAL_ADMIN_PASSWORD or secrets.token_urlsafe(16)
        user = User(
            username=s.INITIAL_ADMIN_USERNAME,
            password_hash=hash_password(password),
            is_active=True,
        )
        db.add(user)
        db.commit()

        if not s.INITIAL_ADMIN_PASSWORD:
            print("=" * 60)
            print("Создан первый администратор. Сохраните пароль — он не повторится:")
            print(f"  username: {s.INITIAL_ADMIN_USERNAME}")
            print(f"  password: {password}")
            print("=" * 60)
