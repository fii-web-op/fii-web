"""Pydantic schemas for request/response payloads."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

NewsStatus = Literal["draft", "published"]


# ---------- Auth ----------------------------------------------------------

class LoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1, max_length=255)


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    is_active: bool


# ---------- Blocks / tiles ------------------------------------------------

class BlockFieldIn(BaseModel):
    page_key: str = Field(..., min_length=1, max_length=64)
    tile_id:  str = Field(..., min_length=1, max_length=128)
    field_id: str = Field(..., min_length=1, max_length=64)
    value:    str = Field(default="")


class BlockFieldOut(BlockFieldIn):
    model_config = ConfigDict(from_attributes=True)
    updated_at: datetime


class TileVisibilityIn(BaseModel):
    page_key: str = Field(..., min_length=1, max_length=64)
    tile_id:  str = Field(..., min_length=1, max_length=128)
    is_visible: bool


class TileVisibilityOut(TileVisibilityIn):
    model_config = ConfigDict(from_attributes=True)
    updated_at: datetime


# ---------- Dynamic blocks (admin-added repeatable items) -----------------

class DynamicBlockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    page_key:    str
    list_id:     str
    tile_id:     str
    template_id: str
    position:    int


class DynamicBlockCreateIn(BaseModel):
    page_key:    str = Field(..., min_length=1, max_length=64)
    list_id:     str = Field(..., min_length=1, max_length=128)
    template_id: str = Field(..., min_length=1, max_length=128)
    position:    int | None = None
    # Initial field values (usually the template defaults), seeded as BlockFields.
    fields:      dict[str, str] = Field(default_factory=dict)


class DynamicBlockUpdateIn(BaseModel):
    position: int | None = None


class DynamicBlockBulkItemIn(BaseModel):
    fields: dict[str, str] = Field(default_factory=dict)


class DynamicBlockBulkIn(BaseModel):
    """Adopt a page's existing static items into managed blocks, in one shot."""
    page_key:    str = Field(..., min_length=1, max_length=64)
    list_id:     str = Field(..., min_length=1, max_length=128)
    template_id: str = Field(..., min_length=1, max_length=128)
    items:       list[DynamicBlockBulkItemIn] = Field(default_factory=list)


class PublicOverridesOut(BaseModel):
    """Snapshot that the public site fetches on every page load."""
    page_key: str
    content: dict[str, dict[str, str]]  # tile_id -> field_id -> value
    visibility: dict[str, bool]         # tile_id -> is_visible
    ticker: list[str]
    blocks: list[DynamicBlockOut] = Field(default_factory=list)  # admin-added blocks


# ---------- Ticker --------------------------------------------------------

class TickerReplaceIn(BaseModel):
    items: list[str] = Field(default_factory=list)


# ---------- News ----------------------------------------------------------

class NewsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    publish_date: datetime | None
    status: NewsStatus
    cover_url: str | None
    created_at: datetime
    updated_at: datetime


# ---------- Photos --------------------------------------------------------

class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    original_name: str | None
    caption: str | None
    uploaded_at: datetime


class PhotoUpdateIn(BaseModel):
    caption: str | None = None
