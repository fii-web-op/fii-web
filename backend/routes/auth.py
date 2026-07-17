"""Login + current user endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, hash_password, issue_token, verify_password
from ..database import get_db
from ..models import User
from ..schemas import ChangePasswordIn, LoginIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Annotated[Session, Depends(get_db)]) -> TokenOut:
    user = db.scalar(select(User).where(User.username == payload.username))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный логин или пароль")
    token, expires_at = issue_token(user)
    return TokenOut(access_token=token, expires_at=expires_at)


@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordIn,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Change the signed-in admin's own password.

    Requires the current password so a hijacked JWT alone can't lock the
    real admin out. The new password is bcrypt-hashed just like the seed
    account; existing tokens stay valid until they expire.
    """
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Текущий пароль неверный")
    if payload.new_password == payload.current_password:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Новый пароль совпадает с текущим"
        )
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
