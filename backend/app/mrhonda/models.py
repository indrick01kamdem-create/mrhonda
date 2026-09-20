from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

MAX_SPEC_LENGTH = 120
MAX_SPECS = 12


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class CategoryPayload(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    text: str = Field(default="", max_length=400)
    image: str | None = Field(default=None, max_length=600)
    position: int = Field(default=0, ge=0, le=999)

    @field_validator("title")
    @classmethod
    def title_is_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Le titre est obligatoire")
        return cleaned


class ProductPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category_slug: str = Field(min_length=1, max_length=60)
    price: int = Field(ge=0, le=100_000_000)
    old_price: int | None = Field(default=None, ge=0, le=100_000_000)
    badge: str | None = Field(default=None, max_length=20)
    rating: int = Field(default=0, ge=0, le=5)
    specs: list[str] = Field(default_factory=list)
    image: str | None = Field(default=None, max_length=600)
    visible: bool = True
    position: int = Field(default=0, ge=0, le=999)

    @field_validator("name")
    @classmethod
    def name_is_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Le nom est obligatoire")
        return cleaned

    @field_validator("specs")
    @classmethod
    def clean_specs(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item and item.strip()]
        if len(cleaned) > MAX_SPECS:
            raise ValueError(f"{MAX_SPECS} caractéristiques au maximum")
        for item in cleaned:
            if len(item) > MAX_SPEC_LENGTH:
                raise ValueError(f"Chaque caractéristique est limitée à {MAX_SPEC_LENGTH} caractères")
        return cleaned


class OrderItemPayload(BaseModel):
    id: str = Field(min_length=1, max_length=60)
    quantity: int = Field(ge=1, le=99)


class OrderPayload(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    customer_phone: str = Field(min_length=6, max_length=30)
    customer_city: str | None = Field(default=None, max_length=80)
    note: str | None = Field(default=None, max_length=500)
    items: list[OrderItemPayload] = Field(min_length=1, max_length=50)


class OrderStatusPayload(BaseModel):
    status: Literal["nouvelle", "traitee", "annulee"]
