from __future__ import annotations

import hashlib
import json
import os
from typing import Any

import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from sqlalchemy.exc import IntegrityError

from . import auth, orders, storage
from .models import (
    CategoryPayload,
    LoginPayload,
    OrderPayload,
    OrderStatusPayload,
    ProductPayload,
)

router = APIRouter(prefix="/api/mrhonda", tags=["mrhonda"])

CLOUDINARY_FOLDER = "mrhonda"


def _catalog_payload() -> dict[str, Any]:
    categories = storage.list_categories()
    titles = {row["slug"]: row["title"] for row in categories}
    products = storage.list_products(visible_only=True)
    return {
        "categories": [storage.category_to_public(row) for row in categories],
        "products": [
            storage.product_to_public(row, titles.get(row["category_slug"], ""))
            for row in products
        ],
    }


def _etag(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
    return f'"{hashlib.sha256(raw).hexdigest()[:32]}"'


# ------------------------------------------------------------------- public


@router.get("/catalog", response_model=None)
def get_catalog(request: Request, response: Response) -> Response | dict[str, Any]:
    payload = _catalog_payload()
    etag = _etag(payload)
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers={"ETag": etag})
    response.headers["ETag"] = etag
    return payload


@router.post("/orders")
def create_order(payload: OrderPayload) -> dict[str, Any]:
    catalog = storage.get_products_by_id([item.id for item in payload.items], visible_only=True)
    try:
        snapshot, total = orders.build_order_snapshot(catalog, payload.items)
    except orders.UnknownProductError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    for _ in range(5):
        reference = orders.generate_reference()
        try:
            order = storage.create_order(payload, reference, snapshot, total)
        except IntegrityError:
            # Collision sur la référence : on en tire une autre et on réessaie.
            continue
        return {"reference": order["reference"], "total": order["total"]}

    raise HTTPException(status_code=500, detail="Impossible de générer une référence de commande")


# -------------------------------------------------------------------- admin


@router.post("/auth/login")
def login(payload: LoginPayload) -> dict[str, str]:
    email = payload.email.lower()
    if auth.login_blocked(email):
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives. Réessayez dans quelques minutes.",
        )
    admin = storage.get_admin(email)
    if not admin or not auth.verify_password(payload.password, admin["password_hash"]):
        auth.register_failed_login(email)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    auth.clear_failed_logins(email)
    return {"token": auth.sign_token(admin["email"]), "email": admin["email"]}


@router.get("/admin/categories")
def admin_list_categories(_: str = Depends(auth.require_mrhonda_admin)) -> list[dict[str, Any]]:
    counts_source = storage.list_products(visible_only=False)
    counts: dict[str, int] = {}
    for product in counts_source:
        counts[product["category_slug"]] = counts.get(product["category_slug"], 0) + 1
    return [
        {**storage.category_to_public(row), "product_count": counts.get(row["slug"], 0)}
        for row in storage.list_categories()
    ]


@router.post("/admin/categories", status_code=201)
def admin_create_category(
    payload: CategoryPayload, _: str = Depends(auth.require_mrhonda_admin)
) -> dict[str, Any]:
    return storage.category_to_public(storage.create_category(payload))


@router.put("/admin/categories/{slug}")
def admin_update_category(
    slug: str, payload: CategoryPayload, _: str = Depends(auth.require_mrhonda_admin)
) -> dict[str, Any]:
    row = storage.update_category(slug, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    return storage.category_to_public(row)


@router.delete("/admin/categories/{slug}", status_code=204)
def admin_delete_category(slug: str, _: str = Depends(auth.require_mrhonda_admin)) -> Response:
    count = storage.count_products_in_category(slug)
    if count:
        raise HTTPException(
            status_code=409,
            detail=f"{count} produit{'s' if count > 1 else ''} utilise"
                   f"{'nt' if count > 1 else ''} cette catégorie",
        )
    storage.delete_category(slug)
    return Response(status_code=204)


@router.get("/admin/products")
def admin_list_products(_: str = Depends(auth.require_mrhonda_admin)) -> list[dict[str, Any]]:
    return [storage.product_to_admin(row) for row in storage.list_products(visible_only=False)]


@router.post("/admin/products", status_code=201)
def admin_create_product(
    payload: ProductPayload, _: str = Depends(auth.require_mrhonda_admin)
) -> dict[str, Any]:
    if not storage.category_exists(payload.category_slug):
        raise HTTPException(status_code=400, detail="Catégorie introuvable")
    return storage.product_to_admin(storage.create_product(payload))


@router.put("/admin/products/{product_id}")
def admin_update_product(
    product_id: str, payload: ProductPayload, _: str = Depends(auth.require_mrhonda_admin)
) -> dict[str, Any]:
    if not storage.category_exists(payload.category_slug):
        raise HTTPException(status_code=400, detail="Catégorie introuvable")
    row = storage.update_product(product_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return storage.product_to_admin(row)


@router.delete("/admin/products/{product_id}", status_code=204)
def admin_delete_product(product_id: str, _: str = Depends(auth.require_mrhonda_admin)) -> Response:
    storage.delete_product(product_id)
    return Response(status_code=204)


@router.post("/admin/media")
async def admin_upload_media(
    file: UploadFile = File(...),
    _: str = Depends(auth.require_mrhonda_admin),
) -> dict[str, Any]:
    required = ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
    if not all(os.getenv(name) for name in required):
        raise HTTPException(status_code=500, detail="Cloudinary n'est pas configuré")

    result = cloudinary.uploader.upload(
        file.file,
        resource_type="image",
        folder=CLOUDINARY_FOLDER,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )
    asset = {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "resource_type": result["resource_type"],
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
    }
    storage.save_media_asset(asset)
    return asset


@router.get("/admin/orders")
def admin_list_orders(
    status: str | None = None, _: str = Depends(auth.require_mrhonda_admin)
) -> list[dict[str, Any]]:
    if status and status not in ("nouvelle", "traitee", "annulee"):
        raise HTTPException(status_code=400, detail="Statut inconnu")
    return storage.list_orders(status)


@router.patch("/admin/orders/{order_id}/status")
def admin_update_order_status(
    order_id: int, payload: OrderStatusPayload, _: str = Depends(auth.require_mrhonda_admin)
) -> dict[str, Any]:
    order = storage.update_order_status(order_id, payload.status)
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return order
