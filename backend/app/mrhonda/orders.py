from __future__ import annotations

import secrets
from typing import Any, Iterable

REFERENCE_PREFIX = "MRH-"


class UnknownProductError(Exception):
    def __init__(self, product_id: str) -> None:
        super().__init__(f"Produit introuvable ou indisponible : {product_id}")
        self.product_id = product_id


def build_order_snapshot(
    products_by_id: dict[str, dict[str, Any]],
    items: Iterable[Any],
) -> tuple[list[dict[str, Any]], int]:
    snapshot: list[dict[str, Any]] = []
    total = 0
    for item in items:
        product = products_by_id.get(item.id)
        if product is None:
            raise UnknownProductError(item.id)
        price = int(product["price"])
        total += price * item.quantity
        snapshot.append(
            {
                "id": product["id"],
                "name": product["name"],
                "price": price,
                "quantity": item.quantity,
            }
        )
    return snapshot, total


def generate_reference() -> str:
    return REFERENCE_PREFIX + secrets.token_hex(3).upper()
