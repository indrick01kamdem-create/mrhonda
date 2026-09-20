from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text

from app.storage import engine
from .slugs import unique_slug

CATEGORY_COLUMNS = "slug, title, description, image, position"
PRODUCT_COLUMNS = (
    "id, name, category_slug, price, old_price, badge, rating, specs, image, visible, position"
)


# --------------------------------------------------------------------------- schéma


def init_db() -> None:
    with engine().begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mrhonda_admin_users (
              email         text PRIMARY KEY,
              password_hash text NOT NULL,
              created_at    timestamptz NOT NULL DEFAULT now()
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mrhonda_categories (
              slug        text PRIMARY KEY,
              title       text NOT NULL,
              description text NOT NULL DEFAULT '',
              image       text,
              position    integer NOT NULL DEFAULT 0,
              created_at  timestamptz NOT NULL DEFAULT now(),
              updated_at  timestamptz NOT NULL DEFAULT now()
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mrhonda_products (
              id            text PRIMARY KEY,
              name          text NOT NULL,
              category_slug text NOT NULL REFERENCES mrhonda_categories(slug) ON DELETE RESTRICT,
              price         integer NOT NULL CHECK (price >= 0),
              old_price     integer CHECK (old_price IS NULL OR old_price >= 0),
              badge         text,
              rating        smallint NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
              specs         jsonb NOT NULL DEFAULT '[]'::jsonb,
              image         text,
              visible       boolean NOT NULL DEFAULT true,
              position      integer NOT NULL DEFAULT 0,
              created_at    timestamptz NOT NULL DEFAULT now(),
              updated_at    timestamptz NOT NULL DEFAULT now()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS mrhonda_products_category_idx
              ON mrhonda_products (category_slug)
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mrhonda_orders (
              id             bigserial PRIMARY KEY,
              reference      text NOT NULL UNIQUE,
              customer_name  text NOT NULL,
              customer_phone text NOT NULL,
              customer_city  text,
              note           text,
              items          jsonb NOT NULL,
              total          integer NOT NULL,
              status         text NOT NULL DEFAULT 'nouvelle'
                             CHECK (status IN ('nouvelle','traitee','annulee')),
              created_at     timestamptz NOT NULL DEFAULT now()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS mrhonda_orders_created_idx
              ON mrhonda_orders (created_at DESC)
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mrhonda_media_assets (
              public_id     text PRIMARY KEY,
              url           text NOT NULL,
              resource_type text NOT NULL,
              format        text,
              width         integer,
              height        integer,
              bytes         bigint,
              created_at    timestamptz NOT NULL DEFAULT now()
            )
        """))


# --------------------------------------------------------------- sérialisation


def _specs(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        try:
            decoded = json.loads(value)
        except ValueError:
            return []
        return decoded if isinstance(decoded, list) else []
    return list(value)


def category_to_public(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "slug": row["slug"],
        "title": row["title"],
        "text": row["description"] or "",
        "image": row["image"],
        "position": row["position"],
    }


def product_to_public(row: dict[str, Any], category_title: str) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": category_title,
        "categorySlug": row["category_slug"],
        "price": row["price"],
        "oldPrice": row["old_price"],
        "badge": row["badge"],
        "rating": row["rating"],
        "specs": _specs(row["specs"]),
        "image": row["image"],
    }


def product_to_admin(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category_slug": row["category_slug"],
        "category_title": row.get("category_title", ""),
        "price": row["price"],
        "old_price": row["old_price"],
        "badge": row["badge"],
        "rating": row["rating"],
        "specs": _specs(row["specs"]),
        "image": row["image"],
        "visible": row["visible"],
        "position": row["position"],
    }


# ------------------------------------------------------------------- admins


def get_admin(email: str) -> dict[str, Any] | None:
    with engine().begin() as conn:
        row = conn.execute(
            text("SELECT email, password_hash FROM mrhonda_admin_users WHERE email = :email"),
            {"email": email.lower()},
        ).mappings().first()
    return dict(row) if row else None


def create_admin(email: str, password_hash: str) -> None:
    with engine().begin() as conn:
        conn.execute(
            text("""
                INSERT INTO mrhonda_admin_users (email, password_hash)
                VALUES (:email, :password_hash)
                ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            """),
            {"email": email.lower(), "password_hash": password_hash},
        )


# --------------------------------------------------------------- catégories


def list_categories() -> list[dict[str, Any]]:
    with engine().begin() as conn:
        rows = conn.execute(text(
            f"SELECT {CATEGORY_COLUMNS} FROM mrhonda_categories ORDER BY position, title"
        )).mappings().all()
    return [dict(row) for row in rows]


def category_exists(slug: str) -> bool:
    with engine().begin() as conn:
        found = conn.execute(
            text("SELECT 1 FROM mrhonda_categories WHERE slug = :slug"), {"slug": slug}
        ).first()
    return found is not None


def count_products_in_category(slug: str) -> int:
    with engine().begin() as conn:
        count = conn.execute(
            text("SELECT COUNT(*) FROM mrhonda_products WHERE category_slug = :slug"),
            {"slug": slug},
        ).scalar_one()
    return int(count)


def create_category(payload: Any) -> dict[str, Any]:
    slug = unique_slug(payload.title, exists=category_exists, fallback="categorie")
    with engine().begin() as conn:
        row = conn.execute(
            text(f"""
                INSERT INTO mrhonda_categories (slug, title, description, image, position)
                VALUES (:slug, :title, :description, :image, :position)
                RETURNING {CATEGORY_COLUMNS}
            """),
            {
                "slug": slug,
                "title": payload.title,
                "description": payload.text,
                "image": payload.image,
                "position": payload.position,
            },
        ).mappings().one()
    return dict(row)


def update_category(slug: str, payload: Any) -> dict[str, Any] | None:
    with engine().begin() as conn:
        row = conn.execute(
            text(f"""
                UPDATE mrhonda_categories
                   SET title = :title, description = :description, image = :image,
                       position = :position, updated_at = now()
                 WHERE slug = :slug
             RETURNING {CATEGORY_COLUMNS}
            """),
            {
                "slug": slug,
                "title": payload.title,
                "description": payload.text,
                "image": payload.image,
                "position": payload.position,
            },
        ).mappings().first()
    return dict(row) if row else None


def delete_category(slug: str) -> None:
    with engine().begin() as conn:
        conn.execute(text("DELETE FROM mrhonda_categories WHERE slug = :slug"), {"slug": slug})


# ----------------------------------------------------------------- produits


def list_products(visible_only: bool) -> list[dict[str, Any]]:
    clause = "WHERE p.visible = true" if visible_only else ""
    with engine().begin() as conn:
        rows = conn.execute(text(f"""
            SELECT p.id, p.name, p.category_slug, p.price, p.old_price, p.badge, p.rating,
                   p.specs, p.image, p.visible, p.position,
                   COALESCE(c.title, '') AS category_title
              FROM mrhonda_products p
              LEFT JOIN mrhonda_categories c ON c.slug = p.category_slug
              {clause}
             ORDER BY p.position, p.created_at
        """)).mappings().all()
    return [dict(row) for row in rows]


def get_products_by_id(ids: list[str], visible_only: bool) -> dict[str, dict[str, Any]]:
    if not ids:
        return {}
    clause = "AND visible = true" if visible_only else ""
    with engine().begin() as conn:
        rows = conn.execute(
            text(f"SELECT {PRODUCT_COLUMNS} FROM mrhonda_products WHERE id = ANY(:ids) {clause}"),
            {"ids": list(ids)},
        ).mappings().all()
    return {row["id"]: dict(row) for row in rows}


def product_exists(product_id: str) -> bool:
    with engine().begin() as conn:
        found = conn.execute(
            text("SELECT 1 FROM mrhonda_products WHERE id = :id"), {"id": product_id}
        ).first()
    return found is not None


def create_product(payload: Any) -> dict[str, Any]:
    product_id = unique_slug(payload.name, exists=product_exists, fallback="produit")
    with engine().begin() as conn:
        conn.execute(
            text("""
                INSERT INTO mrhonda_products (
                  id, name, category_slug, price, old_price, badge, rating, specs,
                  image, visible, position
                ) VALUES (
                  :id, :name, :category_slug, :price, :old_price, :badge, :rating,
                  CAST(:specs AS jsonb), :image, :visible, :position
                )
            """),
            _product_params(product_id, payload),
        )
    return next(row for row in list_products(visible_only=False) if row["id"] == product_id)


def update_product(product_id: str, payload: Any) -> dict[str, Any] | None:
    with engine().begin() as conn:
        updated = conn.execute(
            text("""
                UPDATE mrhonda_products
                   SET name = :name, category_slug = :category_slug, price = :price,
                       old_price = :old_price, badge = :badge, rating = :rating,
                       specs = CAST(:specs AS jsonb), image = :image, visible = :visible,
                       position = :position, updated_at = now()
                 WHERE id = :id
             RETURNING id
            """),
            _product_params(product_id, payload),
        ).first()
    if not updated:
        return None
    return next(row for row in list_products(visible_only=False) if row["id"] == product_id)


def delete_product(product_id: str) -> None:
    with engine().begin() as conn:
        conn.execute(text("DELETE FROM mrhonda_products WHERE id = :id"), {"id": product_id})


def _product_params(product_id: str, payload: Any) -> dict[str, Any]:
    return {
        "id": product_id,
        "name": payload.name,
        "category_slug": payload.category_slug,
        "price": payload.price,
        "old_price": payload.old_price,
        "badge": payload.badge,
        "rating": payload.rating,
        "specs": json.dumps(payload.specs, ensure_ascii=False),
        "image": payload.image,
        "visible": payload.visible,
        "position": payload.position,
    }


# -------------------------------------------------------------------- médias


def save_media_asset(asset: dict[str, Any]) -> None:
    with engine().begin() as conn:
        conn.execute(
            text("""
                INSERT INTO mrhonda_media_assets (
                  public_id, url, resource_type, format, width, height, bytes
                ) VALUES (
                  :public_id, :url, :resource_type, :format, :width, :height, :bytes
                )
                ON CONFLICT (public_id) DO UPDATE SET url = EXCLUDED.url
            """),
            {
                "public_id": asset["public_id"],
                "url": asset["url"],
                "resource_type": asset["resource_type"],
                "format": asset.get("format"),
                "width": asset.get("width"),
                "height": asset.get("height"),
                "bytes": asset.get("bytes"),
            },
        )


# ------------------------------------------------------------------ commandes


ORDER_COLUMNS = (
    "id, reference, customer_name, customer_phone, customer_city, note, "
    "items, total, status, created_at"
)


def create_order(payload: Any, reference: str, snapshot: list[dict[str, Any]], total: int) -> dict[str, Any]:
    with engine().begin() as conn:
        row = conn.execute(
            text(f"""
                INSERT INTO mrhonda_orders (
                  reference, customer_name, customer_phone, customer_city, note, items, total
                ) VALUES (
                  :reference, :customer_name, :customer_phone, :customer_city, :note,
                  CAST(:items AS jsonb), :total
                )
                RETURNING {ORDER_COLUMNS}
            """),
            {
                "reference": reference,
                "customer_name": payload.customer_name,
                "customer_phone": payload.customer_phone,
                "customer_city": payload.customer_city,
                "note": payload.note,
                "items": json.dumps(snapshot, ensure_ascii=False),
                "total": total,
            },
        ).mappings().one()
    return dict(row)


def list_orders(status: str | None = None) -> list[dict[str, Any]]:
    clause = "WHERE status = :status" if status else ""
    params = {"status": status} if status else {}
    with engine().begin() as conn:
        rows = conn.execute(
            text(f"SELECT {ORDER_COLUMNS} FROM mrhonda_orders {clause} ORDER BY created_at DESC"),
            params,
        ).mappings().all()
    return [_order_to_dict(row) for row in rows]


def update_order_status(order_id: int, status: str) -> dict[str, Any] | None:
    with engine().begin() as conn:
        row = conn.execute(
            text(f"""
                UPDATE mrhonda_orders SET status = :status
                 WHERE id = :id
             RETURNING {ORDER_COLUMNS}
            """),
            {"id": order_id, "status": status},
        ).mappings().first()
    return _order_to_dict(row) if row else None


def _order_to_dict(row: Any) -> dict[str, Any]:
    order = dict(row)
    order["items"] = _specs(order["items"])
    order["created_at"] = order["created_at"].isoformat()
    return order
