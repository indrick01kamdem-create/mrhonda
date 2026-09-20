"""Crée l'administrateur mrhonda et importe le catalogue initial.

Usage :
    MRHONDA_ADMIN_PASSWORD='...' .venv/bin/python scripts/seed_mrhonda.py
    .venv/bin/python scripts/seed_mrhonda.py --password '...'
    .venv/bin/python scripts/seed_mrhonda.py --password '...' --admin-only

Relancer le script est sans danger : les catégories et produits déjà présents ne sont pas
écrasés. Le mot de passe de l'administrateur, lui, est mis à jour à chaque exécution — ce
script sert donc aussi à réinitialiser l'accès.

L'option --admin-only crée les tables et le compte administrateur, mais n'importe ni les
catégories ni les produits : le catalogue reste vide pour être construit depuis le dashboard.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from sqlalchemy import text  # noqa: E402

from app.mrhonda import auth, storage  # noqa: E402
from app.storage import engine  # noqa: E402

ADMIN_EMAIL = "admin@mrhonda.com"

CATEGORIES = [
    {
        "slug": "pieces-moteur",
        "title": "Pièces moteur",
        "description": "Composants fiables pour remettre un moteur d'aplomb.",
        "image": "https://thumbs.dreamstime.com/b/pi%C3%A8ces-d%C3%A9tach%C3%A9es-pi%C3%A8ce-de-rechange-ou-voiture-m%C3%A9canique-automobile-sur-fond-blanc-ensemble-nouvelle-en-m%C3%A9tal-moteur-service-213989102.jpg",
        "position": 0,
    },
    {
        "slug": "transmission",
        "title": "Transmission",
        "description": "Kits embrayage, boîtes, entraînement et organes de liaison.",
        "image": "https://www.hyundai-pieces.com/assets/img/transmission.png",
        "position": 1,
    },
    {
        "slug": "diagnostic",
        "title": "Diagnostic",
        "description": "Valises OBD, contrôle électronique et inspection atelier.",
        "image": "https://le-de.cdn-website.com/8beea85bfeec413da6a78f8ba7b4d6a6/dms3rep/multi/opt/IMG_1841-640w.JPG",
        "position": 2,
    },
    {
        "slug": "freinage",
        "title": "Freinage",
        "description": "Disques, plaquettes et organes de sécurité.",
        "image": "https://cdn.pkwteile.de/uploads/info_section/article/2783/1767798899_2007_68940efc99168d3e64f48275257233d1.png",
        "position": 3,
    },
    {
        "slug": "climatisation",
        "title": "Climatisation",
        "description": "Compresseurs et circuits de climatisation.",
        "image": "https://s.alicdn.com/@sc04/kf/Hc22bb9e3a09647268622060b9e25c4ffr/SD7V16-1273-1273N-1273-1823-A11-8104010BA-A118104010BA-AC-Compressor-for-Chery-Fulwin-Cowin-Tiggo-Eastar-A520-A516.png",
        "position": 4,
    },
    {
        "slug": "entretien",
        "title": "Entretien",
        "description": "Filtres, consommables et entretien courant.",
        "image": "https://www.carter-cash.com/upload/media/category/0001/18/c9f75eaebb237a298eda5769c5d509be36053c9b.jpeg",
        "position": 5,
    },
]

PRODUCTS = [
    {
        "id": "kit-pieces-auto",
        "name": "Pack Pièces Auto Essentielles",
        "category_slug": "pieces-moteur",
        "price": 85000,
        "old_price": 105000,
        "badge": "MOCK",
        "rating": 4,
        "specs": ["Sélection temporaire", "Pièces de remplacement", "Contrôle compatibilité", "Commande WhatsApp"],
        "image": "https://www.carter-cash.com/upload/media/category/0001/25/81c7f35be70ef7cd5249078863b23738ce7a21ac.jpeg",
        "position": 0,
    },
    {
        "id": "ensemble-moteur-metal",
        "name": "Ensemble Moteur Métal",
        "category_slug": "pieces-moteur",
        "price": 125000,
        "old_price": 150000,
        "badge": "PRO",
        "rating": 5,
        "specs": ["Pièces moteur", "Usage réparation", "Contrôle avant achat", "Stock mock"],
        "image": "https://thumbs.dreamstime.com/b/pi%C3%A8ces-d%C3%A9tach%C3%A9es-pi%C3%A8ce-de-rechange-ou-voiture-m%C3%A9canique-automobile-sur-fond-blanc-ensemble-nouvelle-en-m%C3%A9tal-moteur-service-213989102.jpg",
        "position": 1,
    },
    {
        "id": "kit-mecanique-auto",
        "name": "Kit Mécanique Automobile",
        "category_slug": "pieces-moteur",
        "price": 99000,
        "old_price": None,
        "badge": "BEST",
        "rating": 4,
        "specs": ["Lot multi-pièces", "Usage atelier", "Moteur et entretien", "Image temporaire"],
        "image": "https://thumbs.dreamstime.com/b/les-pi%C3%A8ces-d-automobile-placez-de-la-pi%C3%A8ce-voiture-en-m%C3%A9tal-rechange-automatique-m%C3%A9canicien-moteur-ou-morceau-isol%C3%A9e-sur-le-207018126.jpg",
        "position": 2,
    },
    {
        "id": "entrainement-principal",
        "name": "Entraînement Principal 4BG1",
        "category_slug": "transmission",
        "price": 180000,
        "old_price": 220000,
        "badge": "PROMO",
        "rating": 4,
        "specs": ["Transmission automatique", "Véhicules japonais", "Référence à confirmer", "Commande assistée"],
        "image": "https://image.made-in-china.com/202f0j00hyMqlkAcfEoa/Pi-ces-de-transmission-automatique-pour-voiture-japonaise-entra-nement-principal-pour-4bg1-4hf1-8971689800.webp",
        "position": 3,
    },
    {
        "id": "module-transmission",
        "name": "Module Transmission Auto",
        "category_slug": "transmission",
        "price": 145000,
        "old_price": None,
        "badge": None,
        "rating": 4,
        "specs": ["Transmission", "Assemblage complet", "Compatibilité à valider", "Usage atelier"],
        "image": "https://www.hyundai-pieces.com/assets/img/transmission.png",
        "position": 4,
    },
    {
        "id": "kit-embrayage",
        "name": "Kit d'Embrayage",
        "category_slug": "transmission",
        "price": 78000,
        "old_price": 92000,
        "badge": "FLASH",
        "rating": 5,
        "specs": ["Disque", "Mécanisme", "Butée selon modèle", "Vérification WhatsApp"],
        "image": "https://gap-33.fr/wp-content/uploads/2024/02/Kits-dEmbrayage.jpeg",
        "position": 5,
    },
    {
        "id": "compresseur-clim",
        "name": "Compresseur Climatisation",
        "category_slug": "climatisation",
        "price": 110000,
        "old_price": None,
        "badge": None,
        "rating": 4,
        "specs": ["Compresseur AC", "Référence à confirmer", "Pièce mockée", "Montage atelier"],
        "image": "https://s.alicdn.com/@sc04/kf/Hc22bb9e3a09647268622060b9e25c4ffr/SD7V16-1273-1273N-1273-1823-A11-8104010BA-A118104010BA-AC-Compressor-for-Chery-Fulwin-Cowin-Tiggo-Eastar-A520-A516.png",
        "position": 6,
    },
    {
        "id": "kit-freinage",
        "name": "Kit Freinage Complet",
        "category_slug": "freinage",
        "price": 65000,
        "old_price": 79000,
        "badge": "SECURITE",
        "rating": 5,
        "specs": ["Disques et plaquettes", "Contrôle sécurité", "Montage conseillé", "Compatibilité modèle"],
        "image": "https://cdn.pkwteile.de/uploads/info_section/article/2783/1767798899_2007_68940efc99168d3e64f48275257233d1.png",
        "position": 7,
    },
    {
        "id": "diagnostic-atelier",
        "name": "Diagnostic Atelier",
        "category_slug": "diagnostic",
        "price": 35000,
        "old_price": None,
        "badge": "SERVICE",
        "rating": 5,
        "specs": ["Lecture défauts", "Inspection rapide", "Rapport de panne", "Conseil réparation"],
        "image": "https://le-de.cdn-website.com/8beea85bfeec413da6a78f8ba7b4d6a6/dms3rep/multi/opt/IMG_1841-640w.JPG",
        "position": 8,
    },
    {
        "id": "pack-entretien",
        "name": "Pack Entretien Auto",
        "category_slug": "entretien",
        "price": 45000,
        "old_price": 56000,
        "badge": None,
        "rating": 4,
        "specs": ["Filtres et consommables", "Entretien courant", "Sélection mock", "Commande rapide"],
        "image": "https://www.carter-cash.com/upload/media/category/0001/18/c9f75eaebb237a298eda5769c5d509be36053c9b.jpeg",
        "position": 9,
    },
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default=os.getenv("MRHONDA_ADMIN_PASSWORD"))
    parser.add_argument(
        "--admin-only",
        action="store_true",
        help="Créer uniquement le compte administrateur, sans importer le catalogue.",
    )
    args = parser.parse_args()

    if not args.password:
        print("Mot de passe manquant : passez --password ou MRHONDA_ADMIN_PASSWORD", file=sys.stderr)
        return 1
    if not os.getenv("DATABASE_URL") and not os.getenv("NEON_DATABASE_URL"):
        print("DATABASE_URL manquant", file=sys.stderr)
        return 1

    storage.init_db()
    print("Tables prêtes.")

    storage.create_admin(ADMIN_EMAIL, auth.password_hash(args.password))
    print(f"Administrateur {ADMIN_EMAIL} enregistré.")

    if args.admin_only:
        print("Mode --admin-only : catalogue non importé, aucune catégorie ni produit créé.")
        return 0

    print("Mode complet : import du catalogue initial (catégories et produits).")

    with engine().begin() as conn:
        for category in CATEGORIES:
            conn.execute(
                text("""
                    INSERT INTO mrhonda_categories (slug, title, description, image, position)
                    VALUES (:slug, :title, :description, :image, :position)
                    ON CONFLICT (slug) DO NOTHING
                """),
                category,
            )
        print(f"{len(CATEGORIES)} catégories importées (les existantes sont conservées).")

        for product in PRODUCTS:
            conn.execute(
                text("""
                    INSERT INTO mrhonda_products (
                      id, name, category_slug, price, old_price, badge, rating, specs,
                      image, visible, position
                    ) VALUES (
                      :id, :name, :category_slug, :price, :old_price, :badge, :rating,
                      CAST(:specs AS jsonb), :image, true, :position
                    )
                    ON CONFLICT (id) DO NOTHING
                """),
                {**product, "specs": json.dumps(product["specs"], ensure_ascii=False)},
            )
        print(f"{len(PRODUCTS)} produits importés (les existants sont conservés).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
