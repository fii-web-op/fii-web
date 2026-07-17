"""Reset an admin user's password from the command line.

Handy when the current password is lost — the self-service change form
(`POST /api/auth/change-password`) needs the old password, this does not.

Run it in the Railway service shell (or locally). It talks to the same
database and uses the same bcrypt hashing as the running app, so the new
password works for the admin login immediately — no redeploy needed.

    python -m backend.set_password <username> <new_password>

Example on Railway (JWT_SECRET / DATABASE_URL already in the environment):

    python -m backend.set_password admin 'MyN3wPassw0rd!'

If the user does not exist yet it is created as an active admin.
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from .auth import hash_password
from .database import SessionLocal
from .models import User


def set_password(username: str, new_password: str) -> str:
    """Create or update ``username`` with ``new_password``. Returns an action word."""
    if len(new_password) < 8:
        raise SystemExit("Пароль должен быть не короче 8 символов.")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            user = User(username=username, password_hash=hash_password(new_password), is_active=True)
            db.add(user)
            action = "создан"
        else:
            user.password_hash = hash_password(new_password)
            user.is_active = True
            action = "обновлён"
        db.commit()
    return action


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Использование: python -m backend.set_password <username> <new_password>", file=sys.stderr)
        return 2
    username, new_password = argv
    action = set_password(username, new_password)
    print(f"Пароль пользователя «{username}» {action}. Можно входить в админ-панель.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
