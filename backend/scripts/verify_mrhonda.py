"""Vérifie le CRUD mrhonda de bout en bout contre la base configurée.

Le script crée des données de test préfixées ZZTEST, les manipule, puis les supprime.
Usage : .venv/bin/python scripts/verify_mrhonda.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.mrhonda import orders, storage  # noqa: E402
from app.mrhonda.models import CategoryPayload, OrderItemPayload, OrderPayload, ProductPayload  # noqa: E402

failures: list[str] = []


def check(label: str, condition: bool) -> None:
    print(f"{'OK  ' if condition else 'ÉCHEC'} {label}")
    if not condition:
        failures.append(label)


def main() -> int:
    storage.init_db()
    category = product = order = None
    try:
        category = storage.create_category(
            CategoryPayload(title="ZZTEST Catégorie", text="temporaire", position=999)
        )
        check("création de catégorie", category["slug"].startswith("zztest"))

        updated = storage.update_category(
            category["slug"], CategoryPayload(title="ZZTEST Modifiée", text="", position=999)
        )
        check("modification de catégorie", updated is not None and updated["title"] == "ZZTEST Modifiée")

        product = storage.create_product(
            ProductPayload(
                name="ZZTEST Produit",
                category_slug=category["slug"],
                price=1000,
                specs=["a", "b"],
            )
        )
        check("création de produit", product["id"].startswith("zztest"))
        check("jointure du titre de catégorie", product["category_title"] == "ZZTEST Modifiée")

        check("comptage des produits d'une catégorie",
              storage.count_products_in_category(category["slug"]) == 1)

        found = storage.get_products_by_id([product["id"]], visible_only=True)
        check("lecture par identifiants", product["id"] in found)

        snapshot, total = orders.build_order_snapshot(
            found, [OrderItemPayload(id=product["id"], quantity=3)]
        )
        check("total calculé côté serveur", total == 3000)

        order = storage.create_order(
            OrderPayload(
                customer_name="ZZTEST Client",
                customer_phone="+237600000000",
                items=[OrderItemPayload(id=product["id"], quantity=3)],
            ),
            orders.generate_reference(),
            snapshot,
            total,
        )
        check("création de commande", order["reference"].startswith("MRH-"))
        check("statut initial", order["status"] == "nouvelle")
        check("articles décodés", isinstance(order["items"], list) and order["items"][0]["quantity"] == 3)

        changed = storage.update_order_status(order["id"], "traitee")
        check("changement de statut", changed is not None and changed["status"] == "traitee")

        check("filtre par statut",
              any(o["id"] == order["id"] for o in storage.list_orders("traitee")))

        try:
            storage.delete_category(category["slug"])
            check("suppression d'une catégorie occupée refusée", False)
        except Exception:
            check("suppression d'une catégorie occupée refusée", True)

    finally:
        # Chaque suppression est isolée : si l'une échoue, les suivantes doivent
        # quand même s'exécuter, sinon une panne passagère laisserait des lignes
        # ZZTEST derrière elle. L'ordre suit la clé étrangère : commande, puis
        # produit, puis catégorie.
        def cleanup(label: str, action) -> None:
            try:
                action()
            except Exception as exc:  # noqa: BLE001 - on veut poursuivre le nettoyage
                failures.append(f"nettoyage {label}")
                print(f"ÉCHEC nettoyage {label} : {exc}")

        if order:
            def drop_order() -> None:
                from sqlalchemy import text
                from app.storage import engine

                with engine().begin() as conn:
                    conn.execute(
                        text("DELETE FROM mrhonda_orders WHERE id = :id"), {"id": order["id"]}
                    )

            cleanup("de la commande", drop_order)
        if product:
            cleanup("du produit", lambda: storage.delete_product(product["id"]))
        if category:
            cleanup("de la catégorie", lambda: storage.delete_category(category["slug"]))
        print("Données de test supprimées.")

    if failures:
        print(f"\n{len(failures)} ÉCHEC(S) : " + ", ".join(failures))
        return 1
    print("\nTOUT OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
