# Dashboard admin mrhonda — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doter la boutique mrhonda d'un dashboard d'administration sur `/admin/123rvf` permettant de gérer produits, catégories, images et commandes, avec un catalogue servi par une API au lieu d'être codé en dur.

**Architecture:** Un module FastAPI isolé `app/mrhonda/` s'ajoute au backend generalpolstermoebel déjà en production, avec ses propres tables préfixées `mrhonda_` et un token d'authentification scopé qui empêche tout accès croisé entre les deux sites. Le frontend React remplace ses données statiques par un fetch de `/api/mrhonda/catalog` et charge le code du dashboard en `React.lazy` pour que les visiteurs de la boutique ne le téléchargent jamais.

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2.0 (SQL brut via `text()`), Postgres/Neon, Cloudinary, pytest — React 19, Vite 6, Tailwind 4, lucide-react, vitest.

**Spec de référence:** `docs/superpowers/specs/2026-08-27-dashboard-admin-mrhonda-design.md`

## Deux dépôts

Ce plan touche deux dépôts distincts. Chaque tâche indique lequel.

| Alias | Chemin absolu | Dépôt GitHub |
|---|---|---|
| **BACKEND** | `/Users/macbookpro/Desktop/dev/generalpolstermoebel/backend` | `indrick01kamdem-create/generalpolstermoebel-backend` |
| **FRONTEND** | `/Users/macbookpro/Desktop/dev/mrhonda` | `indrick01kamdem-create/mrhonda` |

Les commandes `git` et `pytest`/`npm` s'exécutent depuis la racine du dépôt concerné. Les
commits vont dans le dépôt de la tâche : ne jamais mélanger les deux dans un même commit.

## Global Constraints

- **Le site generalpolstermoebel tourne en production.** Le seul fichier existant du BACKEND
  qui peut être modifié est `app/main.py`, et uniquement pour y ajouter trois lignes
  (Task 6). Aucune modification de `app/storage.py`, `app/default_content.py`, ni des
  routes existantes.
- Toutes les tables sont préfixées `mrhonda_`. Ne jamais écrire dans `site_content`,
  `admin_users` ou `media_assets`.
- Scope du token : `"mrhonda"`. Un token sans ce scope est rejeté.
- Durée de vie du token : 12 heures (`60 * 60 * 12` secondes).
- URL admin : `/admin/123rvf` exactement.
- Compte admin initial : `admin@mrhonda.com`. **Le mot de passe ne figure jamais dans le
  code, dans un test, ni dans un commit** — il est passé au script de seed par argument ou
  variable d'environnement. Les commandes de vérification de ce plan lisent
  `$MRHONDA_ADMIN_PASSWORD` : exportez-la dans votre shell avant de les exécuter
  (`read -rs MRHONDA_ADMIN_PASSWORD && export MRHONDA_ADMIN_PASSWORD`), et n'écrivez la
  valeur nulle part.
- Prix : entiers en FCFA, sans décimales. Jamais de flottants.
- Casse des clés JSON : `camelCase` dans la réponse publique `GET /api/mrhonda/catalog`
  uniquement ; `snake_case` partout ailleurs. La conversion se fait dans
  `app/mrhonda/storage.py`, nulle part ailleurs.
- Slugs (`mrhonda_products.id`, `mrhonda_categories.slug`) générés à la création,
  **immuables** ensuite.
- Langue de toutes les chaînes destinées à l'utilisateur : français.
- Python : `from __future__ import annotations` en tête de chaque nouveau module, comme le
  reste du BACKEND.
- Commits en anglais, une tâche = un commit minimum.

## Précision sur le total d'une commande

`mrhonda_orders.total` est la **somme des lignes d'articles, livraison exclue**. La
livraison (2500 FCFA forfaitaires dans `CartPage.jsx`) reste un affichage côté client et
n'est pas persistée : la dupliquer en base créerait deux sources de vérité pour un montant
qui se négocie de toute façon sur WhatsApp. Le dashboard affiche donc « Total articles ».

## File Structure

### BACKEND — fichiers créés

| Fichier | Responsabilité |
|---|---|
| `app/mrhonda/__init__.py` | Marqueur de package, vide |
| `app/mrhonda/slugs.py` | Génération de slugs uniquement. Aucune dépendance projet. |
| `app/mrhonda/auth.py` | Mots de passe, tokens scopés, anti-force brute, dépendance FastAPI d'authentification |
| `app/mrhonda/models.py` | Schémas Pydantic. Aucune logique, aucun SQL. |
| `app/mrhonda/storage.py` | Tout le SQL et la sérialisation des lignes. Ne lève jamais de `HTTPException`. |
| `app/mrhonda/orders.py` | Calcul du contenu et du total d'une commande, génération de référence. Fonctions pures. |
| `app/mrhonda/routes.py` | `APIRouter` : validation, appels au storage, traduction des erreurs en HTTP. Aucun SQL. |
| `scripts/seed_mrhonda.py` | Création de l'admin et import du catalogue initial |
| `scripts/verify_mrhonda.py` | Vérification bout en bout du CRUD contre une vraie base |
| `tests/test_mrhonda_slugs.py` | |
| `tests/test_mrhonda_auth.py` | |
| `tests/test_mrhonda_models.py` | |
| `tests/test_mrhonda_serializers.py` | |
| `tests/test_mrhonda_orders.py` | |
| `tests/test_mrhonda_routing.py` | Garde-fou anti-régression sur les routes existantes |

### BACKEND — fichiers modifiés

| Fichier | Modification |
|---|---|
| `requirements.txt` | Ajout de `pytest` et `httpx` |
| `app/main.py` | Trois lignes : import, `include_router`, init des tables au startup |

### FRONTEND — fichiers créés

| Fichier | Responsabilité |
|---|---|
| `src/api/client.js` | Wrapper `fetch` : base URL, en-tête `Bearer`, normalisation des erreurs |
| `src/api/catalog.js` | `fetchCatalog()` |
| `src/api/orders.js` | `createOrder()` |
| `src/api/adminApi.js` | Toutes les routes admin |
| `src/hooks/useCatalog.js` | État du catalogue partagé par la boutique |
| `src/components/shop/CatalogSkeleton.jsx` | Placeholders de chargement |
| `src/components/shop/ErrorState.jsx` | Erreur + bouton Réessayer |
| `src/components/shop/CheckoutDialog.jsx` | Formulaire client avant WhatsApp |
| `src/pages/admin/AdminApp.jsx` | Racine du dashboard, lazy-loadée |
| `src/pages/admin/useAdminAuth.js` | Token en `sessionStorage`, login, logout, purge sur 401 |
| `src/pages/admin/AdminLogin.jsx` | |
| `src/pages/admin/AdminLayout.jsx` | En-tête, onglets, déconnexion |
| `src/pages/admin/ProductsPanel.jsx` | Tableau des produits |
| `src/pages/admin/ProductForm.jsx` | Formulaire produit |
| `src/pages/admin/CategoriesPanel.jsx` | |
| `src/pages/admin/CategoryForm.jsx` | |
| `src/pages/admin/OrdersPanel.jsx` | |
| `src/pages/admin/ImageField.jsx` | Upload Cloudinary ou URL |
| `src/pages/admin/ui.jsx` | Primitives partagées du dashboard (champ, bouton, bandeau) |
| `src/api/client.test.js` | |
| `src/utils/catalog.test.js` | |
| `.env.local` | `VITE_API_BASE_URL` en développement (non commité) |

### FRONTEND — fichiers modifiés

| Fichier | Modification |
|---|---|
| `package.json` | Ajout de `vitest` et du script `test` |
| `src/data/shop.js` | Ne garde que `WA_NUMBER` |
| `src/utils/catalog.js` | **Créé** : `buildFilters()`, dérivation pure |
| `src/main.jsx` | Route `/admin/123rvf`, `useCatalog`, panier vide au départ |
| `src/pages/shop/ShopHomePage.jsx` | Reçoit `products` et `categories` en props |
| `src/pages/shop/CategoryPage.jsx` | Reçoit les données en props, filtres dérivés |
| `src/pages/shop/ProductDetailPage.jsx` | Ajout de l'état `loading` |
| `src/pages/shop/CartPage.jsx` | Ouvre `CheckoutDialog` avant WhatsApp |

---

# Phase 1 — Backend

## Task 1: Outillage de test et slugs

**Dépôt:** BACKEND

**Files:**
- Modify: `requirements.txt`
- Create: `app/mrhonda/__init__.py`
- Create: `app/mrhonda/slugs.py`
- Test: `tests/test_mrhonda_slugs.py`

**Interfaces:**
- Consumes: rien
- Produces:
  - `slugify(value: str, fallback: str = "element") -> str`
  - `unique_slug(value: str, exists: Callable[[str], bool], fallback: str = "element") -> str`
  - `MAX_SLUG_LENGTH: int = 60`

Le projet n'a aucun test aujourd'hui. Cette tâche installe pytest et l'utilise
immédiatement sur la brique la plus simple.

- [ ] **Step 1: Ajouter les dépendances de test**

Dans `requirements.txt`, ajouter à la fin :

```
pytest==8.3.4
httpx==0.28.1
```

`httpx` est requis par `fastapi.testclient.TestClient`, utilisé en Task 6.

- [ ] **Step 2: Installer**

```bash
cd /Users/macbookpro/Desktop/dev/generalpolstermoebel/backend
.venv/bin/pip install -r requirements.txt
```

- [ ] **Step 3: Créer le package**

```bash
mkdir -p app/mrhonda tests
touch app/mrhonda/__init__.py
```

- [ ] **Step 4: Écrire le test qui échoue**

`tests/test_mrhonda_slugs.py` :

```python
from __future__ import annotations

from app.mrhonda.slugs import MAX_SLUG_LENGTH, slugify, unique_slug


def test_slugify_removes_accents_and_spaces():
    assert slugify("Pièces moteur") == "pieces-moteur"


def test_slugify_collapses_punctuation_and_trims():
    assert slugify("  Kit  Mécanique / Auto !! ") == "kit-mecanique-auto"


def test_slugify_falls_back_when_nothing_usable_remains():
    assert slugify("!!!") == "element"
    assert slugify("", fallback="produit") == "produit"
    assert slugify("???", fallback="categorie") == "categorie"


def test_slugify_truncates_without_trailing_hyphen():
    result = slugify("a" * 80)
    assert len(result) <= MAX_SLUG_LENGTH
    assert not result.endswith("-")


def test_unique_slug_returns_base_when_free():
    assert unique_slug("Freinage", exists=lambda slug: False) == "freinage"


def test_unique_slug_appends_incrementing_suffix():
    taken = {"freinage", "freinage-2"}
    assert unique_slug("Freinage", exists=lambda slug: slug in taken) == "freinage-3"


def test_unique_slug_suffix_respects_max_length():
    taken = {"a" * MAX_SLUG_LENGTH}
    result = unique_slug("a" * 80, exists=lambda slug: slug in taken)
    assert len(result) <= MAX_SLUG_LENGTH
    assert result.endswith("-2")
```

- [ ] **Step 5: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_slugs.py -v
```

Attendu : `ModuleNotFoundError: No module named 'app.mrhonda.slugs'`

- [ ] **Step 6: Écrire l'implémentation**

`app/mrhonda/slugs.py` :

```python
from __future__ import annotations

import re
import unicodedata
from typing import Callable

MAX_SLUG_LENGTH = 60


def slugify(value: str, fallback: str = "element") -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    hyphenated = re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")
    if not hyphenated:
        return fallback
    return hyphenated[:MAX_SLUG_LENGTH].strip("-")


def unique_slug(value: str, exists: Callable[[str], bool], fallback: str = "element") -> str:
    base = slugify(value, fallback)
    if not exists(base):
        return base
    suffix = 2
    while True:
        room = MAX_SLUG_LENGTH - len(str(suffix)) - 1
        candidate = f"{base[:room].strip('-')}-{suffix}"
        if not exists(candidate):
            return candidate
        suffix += 1
```

- [ ] **Step 7: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_slugs.py -v
```

Attendu : 7 passed

- [ ] **Step 8: Commit**

```bash
git add requirements.txt app/mrhonda/__init__.py app/mrhonda/slugs.py tests/test_mrhonda_slugs.py
git commit -m "feat(mrhonda): add slug generation with pytest setup"
```

---

## Task 2: Authentification scopée

**Dépôt:** BACKEND

**Files:**
- Create: `app/mrhonda/auth.py`
- Test: `tests/test_mrhonda_auth.py`

**Interfaces:**
- Consumes: rien de la Task 1
- Produces:
  - `TOKEN_SCOPE: str = "mrhonda"`, `TOKEN_TTL_SECONDS: int`, `MAX_LOGIN_ATTEMPTS: int = 5`, `LOGIN_WINDOW_SECONDS: int = 900`
  - `password_hash(password: str, salt: str | None = None) -> str`
  - `verify_password(password: str, stored: str) -> bool`
  - `sign_token(email: str, now: float | None = None) -> str`
  - `verify_token(token: str) -> str` — lève `HTTPException(401)`
  - `register_failed_login(email, now=None) -> None`, `clear_failed_logins(email) -> None`, `login_blocked(email, now=None) -> bool`
  - `require_mrhonda_admin(authorization: str | None = Header(default=None)) -> str` — dépendance FastAPI

Le paramètre `now` sur `sign_token`, `register_failed_login` et `login_blocked` existe pour
que les tests contrôlent le temps sans `sleep` ni monkeypatch.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/test_mrhonda_auth.py` :

```python
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

import pytest
from fastapi import HTTPException

from app.mrhonda import auth


def test_password_verifies_against_its_own_hash():
    stored = auth.password_hash("un-mot-de-passe-de-test")
    assert auth.verify_password("un-mot-de-passe-de-test", stored) is True


def test_password_does_not_verify_against_another_password():
    stored = auth.password_hash("un-mot-de-passe-de-test")
    assert auth.verify_password("un-mot-de-passe-de-Test", stored) is False


def test_two_hashes_of_the_same_password_differ():
    assert auth.password_hash("secret") != auth.password_hash("secret")


def test_malformed_stored_hash_is_rejected_without_raising():
    assert auth.verify_password("secret", "pas-un-hash") is False


def test_valid_token_returns_lowercased_email():
    token = auth.sign_token("Admin@Mrhonda.com")
    assert auth.verify_token(token) == "admin@mrhonda.com"


def test_expired_token_is_rejected():
    token = auth.sign_token("admin@mrhonda.com", now=time.time() - auth.TOKEN_TTL_SECONDS - 10)
    with pytest.raises(HTTPException) as excinfo:
        auth.verify_token(token)
    assert excinfo.value.status_code == 401


def test_tampered_signature_is_rejected():
    raw, _ = auth.sign_token("admin@mrhonda.com").split(".", 1)
    with pytest.raises(HTTPException):
        auth.verify_token(f"{raw}.0000")


def test_token_without_scope_is_rejected_even_when_correctly_signed():
    """Un token generalpolstermoebel n'a pas de scope : il ne doit jamais passer ici."""
    payload = {"email": "admin@example.com", "exp": int(time.time() + 3600)}
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(auth.secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    with pytest.raises(HTTPException):
        auth.verify_token(f"{raw}.{signature}")


def test_token_with_foreign_scope_is_rejected():
    payload = {"email": "a@b.com", "scope": "gpm", "exp": int(time.time() + 3600)}
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(auth.secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    with pytest.raises(HTTPException):
        auth.verify_token(f"{raw}.{signature}")


def test_garbage_token_is_rejected():
    with pytest.raises(HTTPException):
        auth.verify_token("nimportequoi")


def test_login_is_blocked_only_after_the_configured_number_of_failures():
    auth.clear_failed_logins("brute@mrhonda.com")
    for _ in range(auth.MAX_LOGIN_ATTEMPTS - 1):
        auth.register_failed_login("brute@mrhonda.com")
    assert auth.login_blocked("brute@mrhonda.com") is False
    auth.register_failed_login("brute@mrhonda.com")
    assert auth.login_blocked("brute@mrhonda.com") is True


def test_successful_login_clears_the_counter():
    auth.clear_failed_logins("ok@mrhonda.com")
    for _ in range(auth.MAX_LOGIN_ATTEMPTS):
        auth.register_failed_login("ok@mrhonda.com")
    auth.clear_failed_logins("ok@mrhonda.com")
    assert auth.login_blocked("ok@mrhonda.com") is False


def test_attempts_outside_the_window_no_longer_count():
    auth.clear_failed_logins("old@mrhonda.com")
    stale = time.time() - auth.LOGIN_WINDOW_SECONDS - 60
    for _ in range(auth.MAX_LOGIN_ATTEMPTS):
        auth.register_failed_login("old@mrhonda.com", now=stale)
    assert auth.login_blocked("old@mrhonda.com") is False


def test_blocking_is_per_email():
    auth.clear_failed_logins("a@mrhonda.com")
    auth.clear_failed_logins("b@mrhonda.com")
    for _ in range(auth.MAX_LOGIN_ATTEMPTS):
        auth.register_failed_login("a@mrhonda.com")
    assert auth.login_blocked("b@mrhonda.com") is False
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_auth.py -v
```

Attendu : `ModuleNotFoundError: No module named 'app.mrhonda.auth'`

- [ ] **Step 3: Écrire l'implémentation**

`app/mrhonda/auth.py` :

```python
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import Header, HTTPException

from . import storage

TOKEN_SCOPE = "mrhonda"
TOKEN_TTL_SECONDS = 60 * 60 * 12
PBKDF2_ROUNDS = 120_000
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 60 * 15

INVALID_SESSION = "Session invalide ou expirée"

_login_attempts: dict[str, list[float]] = {}


def secret_key() -> str:
    return (
        os.getenv("MRHONDA_TOKEN_SECRET")
        or os.getenv("ADMIN_TOKEN_SECRET")
        or "mrhonda-dev-secret-change-me"
    )


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ROUNDS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt = stored.split("$", 1)[0]
    return hmac.compare_digest(password_hash(password, salt), stored)


def sign_token(email: str, now: float | None = None) -> str:
    issued = time.time() if now is None else now
    payload = {
        "email": email.lower(),
        "scope": TOKEN_SCOPE,
        "exp": int(issued + TOKEN_TTL_SECONDS),
    }
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{signature}"


def verify_token(token: str) -> str:
    if not token or "." not in token:
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    raw, signature = token.rsplit(".", 1)
    expected = hmac.new(secret_key().encode(), raw.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    try:
        payload: dict[str, Any] = json.loads(base64.urlsafe_b64decode(raw.encode()))
    except Exception as exc:
        raise HTTPException(status_code=401, detail=INVALID_SESSION) from exc
    if payload.get("scope") != TOKEN_SCOPE:
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    if int(payload.get("exp", 0)) < time.time():
        raise HTTPException(status_code=401, detail=INVALID_SESSION)
    return str(payload.get("email", "")).lower()


def _recent_attempts(email: str, moment: float) -> list[float]:
    kept = [t for t in _login_attempts.get(email, []) if moment - t < LOGIN_WINDOW_SECONDS]
    _login_attempts[email] = kept
    return kept


def register_failed_login(email: str, now: float | None = None) -> None:
    moment = time.time() if now is None else now
    key = email.lower()
    attempts = _recent_attempts(key, time.time())
    attempts.append(moment)
    _login_attempts[key] = attempts


def clear_failed_logins(email: str) -> None:
    _login_attempts.pop(email.lower(), None)


def login_blocked(email: str, now: float | None = None) -> bool:
    moment = time.time() if now is None else now
    return len(_recent_attempts(email.lower(), moment)) >= MAX_LOGIN_ATTEMPTS


def require_mrhonda_admin(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise")
    email = verify_token(authorization.removeprefix("Bearer ").strip())
    if not storage.get_admin(email):
        raise HTTPException(status_code=401, detail="Administrateur introuvable")
    return email
```

Note sur `register_failed_login` : le nettoyage utilise `time.time()` alors que la tentative
enregistrée utilise `moment`. C'est voulu — cela permet aux tests d'injecter une tentative
ancienne sans qu'elle soit immédiatement purgée par son propre appel.

- [ ] **Step 4: Créer un `storage.py` minimal pour satisfaire l'import**

`auth.py` importe `storage`, qui n'existe pas encore. Créer `app/mrhonda/storage.py` avec
seulement ce qui est nécessaire ici ; la Task 4 le remplira.

```python
from __future__ import annotations

from typing import Any

from sqlalchemy import text

from app.storage import engine


def get_admin(email: str) -> dict[str, Any] | None:
    with engine().begin() as conn:
        row = conn.execute(
            text("SELECT email, password_hash FROM mrhonda_admin_users WHERE email = :email"),
            {"email": email.lower()},
        ).mappings().first()
    return dict(row) if row else None
```

`engine()` est réutilisé depuis `app/storage.py` : une seule pool de connexions pour les
deux modules, et aucune duplication de la logique de normalisation d'URL. C'est une lecture
de l'existant, pas une modification.

- [ ] **Step 5: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_auth.py -v
```

Attendu : 14 passed. Aucun test ne touche la base : `require_mrhonda_admin` n'est pas
testé unitairement, il le sera par `verify_mrhonda.py` en Task 7.

- [ ] **Step 6: Commit**

```bash
git add app/mrhonda/auth.py app/mrhonda/storage.py tests/test_mrhonda_auth.py
git commit -m "feat(mrhonda): add scoped admin authentication"
```

---

## Task 3: Schémas Pydantic

**Dépôt:** BACKEND

**Files:**
- Create: `app/mrhonda/models.py`
- Test: `tests/test_mrhonda_models.py`

**Interfaces:**
- Consumes: rien
- Produces: `LoginPayload`, `CategoryPayload`, `ProductPayload`, `OrderItemPayload`, `OrderPayload`, `OrderStatusPayload`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/test_mrhonda_models.py` :

```python
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.mrhonda.models import (
    CategoryPayload,
    OrderItemPayload,
    OrderPayload,
    OrderStatusPayload,
    ProductPayload,
)


def valid_product(**overrides):
    base = {"name": "Kit embrayage", "category_slug": "transmission", "price": 85000}
    base.update(overrides)
    return base


def test_product_accepts_minimal_payload_with_defaults():
    product = ProductPayload(**valid_product())
    assert product.rating == 0
    assert product.specs == []
    assert product.visible is True
    assert product.old_price is None


def test_product_rejects_negative_price():
    with pytest.raises(ValidationError):
        ProductPayload(**valid_product(price=-1))


def test_product_rejects_rating_above_five():
    with pytest.raises(ValidationError):
        ProductPayload(**valid_product(rating=6))


def test_product_rejects_empty_name():
    with pytest.raises(ValidationError):
        ProductPayload(**valid_product(name="   "))


def test_product_drops_blank_specs_and_trims_them():
    product = ProductPayload(**valid_product(specs=["  Disque  ", "", "   ", "Butée"]))
    assert product.specs == ["Disque", "Butée"]


def test_product_rejects_an_overlong_spec():
    with pytest.raises(ValidationError):
        ProductPayload(**valid_product(specs=["x" * 121]))


def test_product_rejects_too_many_specs():
    with pytest.raises(ValidationError):
        ProductPayload(**valid_product(specs=[f"spec {i}" for i in range(13)]))


def test_category_requires_a_title():
    with pytest.raises(ValidationError):
        CategoryPayload(title="")


def test_category_defaults_are_safe():
    category = CategoryPayload(title="Freinage")
    assert category.text == ""
    assert category.image is None
    assert category.position == 0


def test_order_item_rejects_zero_quantity():
    with pytest.raises(ValidationError):
        OrderItemPayload(id="kit", quantity=0)


def test_order_item_rejects_excessive_quantity():
    with pytest.raises(ValidationError):
        OrderItemPayload(id="kit", quantity=100)


def test_order_requires_at_least_one_item():
    with pytest.raises(ValidationError):
        OrderPayload(customer_name="Jean", customer_phone="+237690000000", items=[])


def test_order_accepts_a_complete_payload():
    order = OrderPayload(
        customer_name="Jean Ndongo",
        customer_phone="+237690000000",
        customer_city="Yaoundé",
        note="Livraison Mvog-Ada",
        items=[{"id": "kit-embrayage", "quantity": 2}],
    )
    assert order.items[0].quantity == 2


def test_order_status_rejects_unknown_value():
    with pytest.raises(ValidationError):
        OrderStatusPayload(status="expediee")


def test_order_status_accepts_known_values():
    for value in ("nouvelle", "traitee", "annulee"):
        assert OrderStatusPayload(status=value).status == value
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_models.py -v
```

Attendu : `ModuleNotFoundError: No module named 'app.mrhonda.models'`

- [ ] **Step 3: Écrire l'implémentation**

`app/mrhonda/models.py` :

```python
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
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_models.py -v
```

Attendu : 15 passed

- [ ] **Step 5: Commit**

```bash
git add app/mrhonda/models.py tests/test_mrhonda_models.py
git commit -m "feat(mrhonda): add request payload schemas"
```

---

## Task 4: Tables et accès au catalogue

**Dépôt:** BACKEND

**Files:**
- Modify: `app/mrhonda/storage.py` (créé en Task 2 avec la seule fonction `get_admin` ; son contenu est intégralement remplacé au Step 3)
- Test: `tests/test_mrhonda_serializers.py`

**Interfaces:**
- Consumes: `app.storage.engine`, `app.mrhonda.slugs.unique_slug`
- Produces:
  - `init_db() -> None`
  - `category_to_public(row: dict) -> dict`
  - `product_to_public(row: dict, category_title: str) -> dict`
  - `product_to_admin(row: dict) -> dict`
  - `list_categories() -> list[dict]` — lignes brutes triées
  - `create_category(payload) -> dict`, `update_category(slug, payload) -> dict | None`, `delete_category(slug) -> None`
  - `count_products_in_category(slug: str) -> int`
  - `list_products(visible_only: bool) -> list[dict]` — jointure incluse, expose `category_title`
  - `get_products_by_id(ids: list[str], visible_only: bool) -> dict[str, dict]`
  - `create_product(payload) -> dict`, `update_product(id, payload) -> dict | None`, `delete_product(id) -> None`
  - `create_admin(email: str, password_hash: str) -> None`
  - `save_media_asset(asset: dict) -> None`

**Écart assumé au spec :** la colonne de description des catégories s'appelle
`description` en base, et non `text`. `text` est un nom de type Postgres ; l'utiliser comme
nom de colonne fonctionne mais rend le SQL confus à relire. L'API continue d'exposer la clé
`text`, comme le prévoit le spec — la traduction se fait dans `category_to_public`, qui est
de toute façon le seul endroit autorisé à convertir les noms.

Seuls les sérialiseurs sont testés unitairement : ce sont les seules fonctions pures du
module. Le reste est vérifié par `scripts/verify_mrhonda.py` (Task 7).

- [ ] **Step 1: Écrire le test qui échoue**

`tests/test_mrhonda_serializers.py` :

```python
from __future__ import annotations

from app.mrhonda.storage import category_to_public, product_to_admin, product_to_public


def category_row(**overrides):
    row = {
        "slug": "pieces-moteur",
        "title": "Pièces moteur",
        "description": "Composants fiables.",
        "image": "https://img/moteur.jpg",
        "position": 2,
    }
    row.update(overrides)
    return row


def product_row(**overrides):
    row = {
        "id": "kit-embrayage",
        "name": "Kit embrayage",
        "category_slug": "transmission",
        "price": 85000,
        "old_price": 105000,
        "badge": "PROMO",
        "rating": 4,
        "specs": ["Disque", "Butée"],
        "image": "https://img/kit.jpg",
        "visible": True,
        "position": 1,
    }
    row.update(overrides)
    return row


def test_category_is_exposed_with_the_text_key():
    result = category_to_public(category_row())
    assert result == {
        "slug": "pieces-moteur",
        "title": "Pièces moteur",
        "text": "Composants fiables.",
        "image": "https://img/moteur.jpg",
        "position": 2,
    }


def test_category_null_description_becomes_an_empty_string():
    assert category_to_public(category_row(description=None))["text"] == ""


def test_public_product_uses_camel_case_and_joins_the_category_title():
    result = product_to_public(product_row(), "Transmission")
    assert result == {
        "id": "kit-embrayage",
        "name": "Kit embrayage",
        "category": "Transmission",
        "categorySlug": "transmission",
        "price": 85000,
        "oldPrice": 105000,
        "badge": "PROMO",
        "rating": 4,
        "specs": ["Disque", "Butée"],
        "image": "https://img/kit.jpg",
    }


def test_public_product_never_leaks_admin_fields():
    result = product_to_public(product_row(), "Transmission")
    assert "visible" not in result
    assert "position" not in result
    assert "old_price" not in result


def test_specs_stored_as_a_json_string_are_decoded():
    result = product_to_public(product_row(specs='["Disque", "Butée"]'), "Transmission")
    assert result["specs"] == ["Disque", "Butée"]


def test_specs_that_are_null_become_an_empty_list():
    assert product_to_public(product_row(specs=None), "Transmission")["specs"] == []


def test_admin_product_keeps_snake_case_and_admin_fields():
    result = product_to_admin({**product_row(), "category_title": "Transmission"})
    assert result["old_price"] == 105000
    assert result["visible"] is True
    assert result["position"] == 1
    assert result["category_title"] == "Transmission"
    assert "oldPrice" not in result
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_serializers.py -v
```

Attendu : `ImportError: cannot import name 'category_to_public'`

- [ ] **Step 3: Remplacer le contenu de `app/mrhonda/storage.py`**

Le fichier créé en Task 2 ne contenait que `get_admin`. Le voici en entier.

```python
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
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/ -v
```

Attendu : 43 passed au total — 7 (Task 1) + 14 (Task 2) + 15 (Task 3) + 7 ici.
Si un test antérieur casse, c'est une régression à corriger avant de continuer.

- [ ] **Step 5: Commit**

```bash
git add app/mrhonda/storage.py tests/test_mrhonda_serializers.py
git commit -m "feat(mrhonda): add catalog tables and data access"
```

---

## Task 5: Construction des commandes

**Dépôt:** BACKEND

**Files:**
- Create: `app/mrhonda/orders.py`
- Modify: `app/mrhonda/storage.py` (ajout des accès aux commandes en fin de fichier)
- Test: `tests/test_mrhonda_orders.py`

**Interfaces:**
- Consumes: `app.mrhonda.models.OrderItemPayload`
- Produces:
  - `UnknownProductError(Exception)` avec attribut `.product_id: str`
  - `build_order_snapshot(products_by_id: dict[str, dict], items: list[OrderItemPayload]) -> tuple[list[dict], int]`
  - `generate_reference() -> str`
  - storage : `create_order(payload, reference: str, snapshot: list[dict], total: int) -> dict`, `list_orders(status: str | None = None) -> list[dict]`, `update_order_status(order_id: int, status: str) -> dict | None`

**Le point critique de cette tâche :** le client n'envoie que des identifiants et des
quantités. Les prix viennent exclusivement de la base. Un navigateur qui poste
`{"price": 1}` ne doit avoir aucun effet — c'est pour cela que `OrderItemPayload` n'a pas
de champ prix du tout.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/test_mrhonda_orders.py` :

```python
from __future__ import annotations

import re

import pytest

from app.mrhonda.models import OrderItemPayload
from app.mrhonda.orders import UnknownProductError, build_order_snapshot, generate_reference

CATALOG = {
    "kit-embrayage": {"id": "kit-embrayage", "name": "Kit embrayage", "price": 85000},
    "valise-obd": {"id": "valise-obd", "name": "Valise OBD", "price": 120000},
}


def items(*pairs):
    return [OrderItemPayload(id=product_id, quantity=quantity) for product_id, quantity in pairs]


def test_snapshot_uses_server_side_prices_and_names():
    snapshot, total = build_order_snapshot(CATALOG, items(("kit-embrayage", 2)))
    assert snapshot == [
        {"id": "kit-embrayage", "name": "Kit embrayage", "price": 85000, "quantity": 2}
    ]
    assert total == 170000


def test_total_sums_every_line():
    _, total = build_order_snapshot(CATALOG, items(("kit-embrayage", 2), ("valise-obd", 1)))
    assert total == 170000 + 120000


def test_unknown_product_is_rejected_with_its_identifier():
    with pytest.raises(UnknownProductError) as excinfo:
        build_order_snapshot(CATALOG, items(("produit-fantome", 1)))
    assert excinfo.value.product_id == "produit-fantome"


def test_a_product_missing_from_the_catalog_because_it_is_hidden_is_rejected():
    """get_products_by_id filtre déjà sur visible ; un produit masqué arrive donc absent."""
    with pytest.raises(UnknownProductError):
        build_order_snapshot({}, items(("kit-embrayage", 1)))


def test_duplicate_lines_are_both_counted():
    snapshot, total = build_order_snapshot(CATALOG, items(("kit-embrayage", 1), ("kit-embrayage", 3)))
    assert len(snapshot) == 2
    assert total == 85000 * 4


def test_reference_matches_the_expected_shape():
    assert re.fullmatch(r"MRH-[0-9A-F]{6}", generate_reference())


def test_references_are_not_predictable_across_calls():
    assert len({generate_reference() for _ in range(50)}) > 45
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_orders.py -v
```

Attendu : `ModuleNotFoundError: No module named 'app.mrhonda.orders'`

- [ ] **Step 3: Écrire `app/mrhonda/orders.py`**

```python
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
```

- [ ] **Step 4: Ajouter les accès commandes à la fin de `app/mrhonda/storage.py`**

```python
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
```

`_specs` est réutilisé pour décoder le `jsonb` : la fonction accepte n'importe quelle liste
JSON, son nom vient seulement de son premier usage.

- [ ] **Step 5: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/ -v
```

Attendu : 50 passed

- [ ] **Step 6: Commit**

```bash
git add app/mrhonda/orders.py app/mrhonda/storage.py tests/test_mrhonda_orders.py
git commit -m "feat(mrhonda): compute order snapshots from server-side prices"
```

---

## Task 6: Routes et montage dans l'application

**Dépôt:** BACKEND

**Files:**
- Create: `app/mrhonda/routes.py`
- Modify: `app/main.py` (trois lignes)
- Test: `tests/test_mrhonda_routing.py`

**Interfaces:**
- Consumes: `models`, `storage`, `auth`, `orders` des tâches précédentes
- Produces: `router: APIRouter` monté sous `/api/mrhonda`

Le test de cette tâche est un **garde-fou anti-régression** : il vérifie que les routes
mrhonda existent *et* que toutes les routes generalpolstermoebel sont toujours là. Il
n'ouvre aucune connexion à la base — importer `app.main` ne déclenche pas le `startup`.

- [ ] **Step 1: Écrire le test qui échoue**

`tests/test_mrhonda_routing.py` :

```python
from __future__ import annotations

from app.main import app

PATHS = {route.path for route in app.routes}
METHODS = {(route.path, method) for route in app.routes for method in getattr(route, "methods", set())}


def test_existing_generalpolstermoebel_routes_are_untouched():
    """Garde-fou : ce module ne doit jamais casser le site en production."""
    for path in ("/api/health", "/api/content", "/api/reviews", "/api/auth/login",
                 "/api/admin/users", "/api/admin/content", "/api/admin/media"):
        assert path in PATHS, f"route existante disparue : {path}"


def test_public_mrhonda_routes_are_mounted():
    assert ("/api/mrhonda/catalog", "GET") in METHODS
    assert ("/api/mrhonda/orders", "POST") in METHODS


def test_admin_mrhonda_routes_are_mounted():
    expected = {
        ("/api/mrhonda/auth/login", "POST"),
        ("/api/mrhonda/admin/categories", "GET"),
        ("/api/mrhonda/admin/categories", "POST"),
        ("/api/mrhonda/admin/categories/{slug}", "PUT"),
        ("/api/mrhonda/admin/categories/{slug}", "DELETE"),
        ("/api/mrhonda/admin/products", "GET"),
        ("/api/mrhonda/admin/products", "POST"),
        ("/api/mrhonda/admin/products/{product_id}", "PUT"),
        ("/api/mrhonda/admin/products/{product_id}", "DELETE"),
        ("/api/mrhonda/admin/media", "POST"),
        ("/api/mrhonda/admin/orders", "GET"),
        ("/api/mrhonda/admin/orders/{order_id}/status", "PATCH"),
    }
    assert expected <= METHODS


def test_no_mrhonda_route_escapes_its_prefix():
    mrhonda_paths = [p for p in PATHS if "mrhonda" in p]
    assert mrhonda_paths, "aucune route mrhonda montée"
    for path in mrhonda_paths:
        assert path.startswith("/api/mrhonda/")
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
.venv/bin/python -m pytest tests/test_mrhonda_routing.py -v
```

Attendu : `test_existing_generalpolstermoebel_routes_are_untouched` passe, les trois autres
échouent en `AssertionError`.

- [ ] **Step 3: Écrire `app/mrhonda/routes.py`**

```python
from __future__ import annotations

import os
from typing import Any

import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile

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
    import hashlib
    import json

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
        except Exception as exc:  # collision sur la contrainte UNIQUE
            if "mrhonda_orders_reference_key" not in str(exc):
                raise
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
```

- [ ] **Step 4: Monter le routeur dans `app/main.py`**

Trois ajouts, aucune suppression.

1. Après la ligne `from . import storage` (vers la ligne 23), ajouter :

```python
from .mrhonda.routes import router as mrhonda_router
```

2. Après le bloc `app.add_middleware(...)` (vers la ligne 41), ajouter :

```python
app.include_router(mrhonda_router)
```

3. Dans la fonction `startup()`, après `storage.init_db(DEFAULT_CONTENT)`, ajouter :

```python
    if storage.database_enabled():
        mrhonda_storage.init_db()
```

et compléter l'import de l'étape 1 :

```python
from .mrhonda import storage as mrhonda_storage
from .mrhonda.routes import router as mrhonda_router
```

Le garde `database_enabled()` reprend la convention du module existant : sans base
configurée, generalpolstermoebel bascule sur ses fichiers JSON locaux, et les tables
mrhonda ne sont simplement pas créées.

- [ ] **Step 5: Vérifier que les tests passent**

```bash
.venv/bin/python -m pytest tests/ -v
```

Attendu : 54 passed

- [ ] **Step 6: Vérifier que l'application démarre réellement**

```bash
.venv/bin/python -c "from app.main import app; print(len(app.routes), 'routes')"
```

Attendu : un nombre supérieur à 20, sans exception d'import.

- [ ] **Step 7: Commit**

```bash
git add app/mrhonda/routes.py app/main.py tests/test_mrhonda_routing.py
git commit -m "feat(mrhonda): expose catalog, order and admin routes"
```

---

## Task 7: Amorçage et vérification contre une vraie base

**Dépôt:** BACKEND

**Files:**
- Create: `scripts/seed_mrhonda.py`
- Create: `scripts/verify_mrhonda.py`

**Interfaces:**
- Consumes: tout le module `app.mrhonda`
- Produces: deux scripts exécutables. Aucune interface consommée par une autre tâche.

C'est ici que le SQL des Tasks 4 et 5 est réellement exercé. Ne pas passer à la Phase 2
avant que `verify_mrhonda.py` affiche `TOUT OK`.

- [ ] **Step 1: Écrire `scripts/seed_mrhonda.py`**

```python
"""Crée l'administrateur mrhonda et importe le catalogue initial.

Usage :
    MRHONDA_ADMIN_PASSWORD='...' .venv/bin/python scripts/seed_mrhonda.py
    .venv/bin/python scripts/seed_mrhonda.py --password '...'

Relancer le script est sans danger : les catégories et produits déjà présents ne sont pas
écrasés. Le mot de passe de l'administrateur, lui, est mis à jour à chaque exécution — ce
script sert donc aussi à réinitialiser l'accès.
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
```

**Six catégories, pas trois.** Le fichier `src/data/shop.js` déclare 3 catégories mais ses
produits en référencent 6 : `climatisation`, `freinage` et `entretien` n'ont pas de carte
sur l'accueil, alors que leurs pages de filtre fonctionnent déjà via la constante `filters`.
Avec la clé étrangère de `mrhonda_products`, un seed à 3 catégories échouerait sur ces trois
produits. Les six sont donc créées.

**Conséquence visible à connaître :** la section « Catégories populaires » de l'accueil
affichera 6 cartes au lieu de 3, soit deux rangées. C'est le comportement cohérent — le site
proposait déjà ces catégories dans ses filtres. Pour n'en afficher que certaines,
l'administrateur supprime ou réordonne les catégories depuis le dashboard.

La liste ci-dessous est la transcription exacte des 10 produits de `src/data/shop.js`. Les
`position` suivent l'ordre du fichier source, car `ShopHomePage` met en avant le premier
produit et affiche les quatre suivants en ventes flash : conserver l'ordre préserve
l'apparence actuelle du site.

```python
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
```

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", default=os.getenv("MRHONDA_ADMIN_PASSWORD"))
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
```

- [ ] **Step 2: Écrire `scripts/verify_mrhonda.py`**

```python
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
        if order:
            from sqlalchemy import text
            from app.storage import engine
            with engine().begin() as conn:
                conn.execute(text("DELETE FROM mrhonda_orders WHERE id = :id"), {"id": order["id"]})
        if product:
            storage.delete_product(product["id"])
        if category:
            storage.delete_category(category["slug"])
        print("Données de test supprimées.")

    if failures:
        print(f"\n{len(failures)} ÉCHEC(S) : " + ", ".join(failures))
        return 1
    print("\nTOUT OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 3: Exécuter la vérification**

```bash
cd /Users/macbookpro/Desktop/dev/generalpolstermoebel/backend
.venv/bin/python scripts/verify_mrhonda.py
```

Attendu : `TOUT OK`. En cas d'échec, corriger le SQL de la Task 4 ou 5 avant de continuer.

- [ ] **Step 4: Amorcer la base**

```bash
MRHONDA_ADMIN_PASSWORD='<le mot de passe convenu>' .venv/bin/python scripts/seed_mrhonda.py
```

Attendu : quatre lignes de confirmation, sans erreur.

- [ ] **Step 5: Vérifier la connexion admin en conditions réelles**

Démarrer le backend puis tenter un login :

```bash
.venv/bin/uvicorn app.main:app --port 8000 &
sleep 3
curl -s -X POST http://127.0.0.1:8000/api/mrhonda/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@mrhonda.com\",\"password\":\"$MRHONDA_ADMIN_PASSWORD\"}"
```

Attendu : `{"token":"...","email":"admin@mrhonda.com"}`

Puis vérifier l'isolation — ce token ne doit pas ouvrir le dashboard generalpolstermoebel :

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/mrhonda/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@mrhonda.com\",\"password\":\"$MRHONDA_ADMIN_PASSWORD\"}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/api/admin/content -H "Authorization: Bearer $TOKEN"
```

Attendu : `401`. Si la réponse est `200`, l'isolation est cassée : ne pas continuer.

Enfin, vérifier le catalogue public :

```bash
curl -s http://127.0.0.1:8000/api/mrhonda/catalog | head -c 400
```

Attendu : un JSON contenant `categories` et `products`.

Arrêter le serveur avec `kill %1`.

- [ ] **Step 6: Commit et déploiement du backend**

```bash
git add scripts/seed_mrhonda.py scripts/verify_mrhonda.py
git commit -m "feat(mrhonda): add seeding and end-to-end verification scripts"
git push origin main
```

Le push déclenche le déploiement Railway. Vérifier ensuite :

```bash
curl -s https://generalpolstermoebel-backend-production.up.railway.app/api/mrhonda/catalog | head -c 200
curl -s https://generalpolstermoebel-backend-production.up.railway.app/api/health
```

Attendu : le catalogue, puis `{"status":"ok"}` — la seconde commande confirme que le site
existant n'a pas été cassé par le déploiement.

---

# Phase 2 — Frontend

**Note sur les tests de cette phase.** Le spec ne prévoyait de tests que côté backend. Le
FRONTEND n'a aujourd'hui aucune dépendance de développement. Ce plan ajoute `vitest` pour
couvrir les **modules purs** (normalisation d'erreurs, dérivations du catalogue) : ce sont
les endroits où un bug est silencieux et coûteux. Les composants React ne sont pas testés
automatiquement — installer `@testing-library/react` et un environnement DOM pour ce projet
ne se justifie pas. Chaque tâche de composant se termine donc par une **vérification
manuelle décrite pas à pas**, à exécuter réellement avant de commiter.

## Task 8: Client API et dérivations du catalogue

**Dépôt:** FRONTEND

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/api/client.js`
- Create: `src/api/catalog.js`
- Create: `src/api/orders.js`
- Create: `src/utils/catalog.js`
- Test: `src/api/client.test.js`
- Test: `src/utils/catalog.test.js`

**Interfaces:**
- Consumes: l'API backend de la Phase 1
- Produces:
  - `ApiError` (classe, champs `status`, `detail`, `body`)
  - `apiFetch(path, { method, body, token, formData }) -> Promise<any>`
  - `normalizeError(status, body) -> ApiError`, `fieldErrors(body) -> Record<string,string>`
  - `fetchCatalog() -> Promise<{categories, products}>`
  - `createOrder({customer_name, customer_phone, customer_city, note, items}) -> Promise<{reference, total}>`
  - `buildFilters(categories) -> {label, slug}[]`, `findCategory(categories, slug)`, `filterProducts(products, slug)`

- [ ] **Step 1: Installer vitest**

```bash
cd /Users/macbookpro/Desktop/dev/mrhonda
npm install --save-dev vitest@^3.0.0
```

Puis dans `package.json`, ajouter au bloc `scripts` :

```json
    "test": "vitest run"
```

- [ ] **Step 2: Configurer vitest**

Dans `vite.config.js`, ajouter la clé `test` à l'objet passé à `defineConfig`, après
`plugins` :

```js
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
```

- [ ] **Step 3: Écrire les tests qui échouent**

`src/api/client.test.js` :

```js
import { describe, expect, it } from 'vitest';
import { ApiError, extractDetail, fieldErrors, normalizeError } from './client';

describe('extractDetail', () => {
  it('lit un detail texte renvoyé par HTTPException', () => {
    expect(extractDetail({ detail: 'Catégorie introuvable' })).toBe('Catégorie introuvable');
  });

  it('assemble les messages de validation 422', () => {
    const body = {
      detail: [
        { loc: ['body', 'price'], msg: 'Input should be greater than or equal to 0' },
        { loc: ['body', 'name'], msg: 'Le nom est obligatoire' },
      ],
    };
    expect(extractDetail(body)).toBe(
      'Input should be greater than or equal to 0, Le nom est obligatoire',
    );
  });

  it('rend une chaîne vide quand le corps est vide', () => {
    expect(extractDetail(null)).toBe('');
    expect(extractDetail({})).toBe('');
  });
});

describe('normalizeError', () => {
  it('produit une ApiError qui reste une Error', () => {
    const error = normalizeError(404, { detail: 'Produit introuvable' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.detail).toBe('Produit introuvable');
    expect(error.message).toBe('Produit introuvable');
  });

  it('se rabat sur le code HTTP quand le serveur ne dit rien', () => {
    expect(normalizeError(500, null).detail).toBe('Erreur 500');
  });
});

describe('fieldErrors', () => {
  it('associe chaque message au dernier segment de loc', () => {
    const body = {
      detail: [
        { loc: ['body', 'price'], msg: 'Prix invalide' },
        { loc: ['body', 'specs', 0], msg: 'Trop long' },
      ],
    };
    expect(fieldErrors(body)).toEqual({ price: 'Prix invalide' });
  });

  it('garde le premier message quand un champ en a plusieurs', () => {
    const body = {
      detail: [
        { loc: ['body', 'name'], msg: 'premier' },
        { loc: ['body', 'name'], msg: 'second' },
      ],
    };
    expect(fieldErrors(body).name).toBe('premier');
  });

  it('rend un objet vide pour une erreur non structurée', () => {
    expect(fieldErrors({ detail: 'texte simple' })).toEqual({});
    expect(fieldErrors(null)).toEqual({});
  });
});
```

Le troisième test de `fieldErrors` mérite une explication : `loc` vaut
`['body', 'specs', 0]`, donc le dernier segment est le nombre `0`. Comme seuls les segments
texte sont retenus, cette entrée est ignorée plutôt que de produire une clé `0` inutilisable
par le formulaire.

`src/utils/catalog.test.js` :

```js
import { describe, expect, it } from 'vitest';
import { buildFilters, filterProducts, findCategory } from './catalog';

const CATEGORIES = [
  { slug: 'pieces-moteur', title: 'Pièces moteur' },
  { slug: 'transmission', title: 'Transmission' },
];

const PRODUCTS = [
  { id: 'a', categorySlug: 'pieces-moteur' },
  { id: 'b', categorySlug: 'transmission' },
  { id: 'c', categorySlug: 'pieces-moteur' },
];

describe('buildFilters', () => {
  it('place Tout en tête puis suit l ordre des catégories', () => {
    expect(buildFilters(CATEGORIES)).toEqual([
      { label: 'Tout', slug: 'all' },
      { label: 'Pièces moteur', slug: 'pieces-moteur' },
      { label: 'Transmission', slug: 'transmission' },
    ]);
  });

  it('rend au minimum Tout quand il n y a aucune catégorie', () => {
    expect(buildFilters([])).toEqual([{ label: 'Tout', slug: 'all' }]);
  });
});

describe('findCategory', () => {
  it('trouve par slug', () => {
    expect(findCategory(CATEGORIES, 'transmission').title).toBe('Transmission');
  });

  it('rend null pour un slug inconnu ou pour all', () => {
    expect(findCategory(CATEGORIES, 'inconnu')).toBeNull();
    expect(findCategory(CATEGORIES, 'all')).toBeNull();
  });
});

describe('filterProducts', () => {
  it('rend tout pour all ou pour un slug absent', () => {
    expect(filterProducts(PRODUCTS, 'all')).toHaveLength(3);
    expect(filterProducts(PRODUCTS, undefined)).toHaveLength(3);
  });

  it('filtre sur categorySlug', () => {
    expect(filterProducts(PRODUCTS, 'pieces-moteur').map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('rend une liste vide pour une catégorie sans produit', () => {
    expect(filterProducts(PRODUCTS, 'diagnostic')).toEqual([]);
  });
});
```

- [ ] **Step 4: Vérifier que les tests échouent**

```bash
npm test
```

Attendu : échec d'import sur `./client` et `./catalog`.

- [ ] **Step 5: Écrire `src/api/client.js`**

```js
const BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, detail, body) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

export function extractDetail(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body.detail === 'string') return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((item) => item?.msg).filter(Boolean).join(', ');
  }
  return '';
}

export function normalizeError(status, body) {
  return new ApiError(status, extractDetail(body) || `Erreur ${status}`, body);
}

export function fieldErrors(body) {
  if (!body || !Array.isArray(body.detail)) return {};
  const errors = {};
  for (const item of body.detail) {
    const loc = Array.isArray(item?.loc) ? item.loc : [];
    const field = loc[loc.length - 1];
    if (typeof field === 'string' && field !== 'body' && !(field in errors)) {
      errors[field] = item.msg;
    }
  }
  return errors;
}

export async function apiFetch(path, { method = 'GET', body, token, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'Connexion au serveur impossible', null);
  }

  if (response.status === 204) return null;

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) throw normalizeError(response.status, payload);
  return payload;
}
```

Le `status: 0` d'une panne réseau est délibéré : il distingue « le serveur a répondu une
erreur » de « le serveur est injoignable », ce dont `ErrorState` a besoin pour proposer le
bon message.

- [ ] **Step 6: Écrire `src/utils/catalog.js`**

```js
export function buildFilters(categories) {
  return [
    { label: 'Tout', slug: 'all' },
    ...categories.map((category) => ({ label: category.title, slug: category.slug })),
  ];
}

export function findCategory(categories, slug) {
  if (!slug || slug === 'all') return null;
  return categories.find((category) => category.slug === slug) || null;
}

export function filterProducts(products, slug) {
  if (!slug || slug === 'all') return products;
  return products.filter((product) => product.categorySlug === slug);
}
```

- [ ] **Step 7: Écrire `src/api/catalog.js` et `src/api/orders.js`**

`src/api/catalog.js` :

```js
import { apiFetch } from './client';

export function fetchCatalog() {
  return apiFetch('/api/mrhonda/catalog');
}
```

`src/api/orders.js` :

```js
import { apiFetch } from './client';

export function createOrder(payload) {
  return apiFetch('/api/mrhonda/orders', { method: 'POST', body: payload });
}
```

- [ ] **Step 8: Vérifier que les tests passent**

```bash
npm test
```

Attendu : 13 passed

- [ ] **Step 9: Configurer l'URL de l'API en développement**

Créer `.env.local` à la racine du FRONTEND :

```
VITE_API_BASE_URL=https://generalpolstermoebel-backend-production.up.railway.app
```

Vérifier que `.env.local` est bien ignoré par git :

```bash
git check-ignore -v .env.local || echo ".env.local n'est PAS ignoré — l'ajouter à .gitignore"
```

Si le fichier n'est pas ignoré, ajouter `.env.local` à `.gitignore`.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js src/api src/utils .gitignore
git commit -m "feat: add API client and catalog helpers with vitest"
```

---

## Task 9: Brancher la boutique sur l'API

**Dépôt:** FRONTEND

**Files:**
- Create: `src/hooks/useCatalog.js`
- Create: `src/components/shop/CatalogSkeleton.jsx`
- Create: `src/components/shop/ErrorState.jsx`
- Modify: `src/data/shop.js`
- Modify: `src/main.jsx`
- Modify: `src/pages/shop/ShopHomePage.jsx`
- Modify: `src/pages/shop/CategoryPage.jsx`
- Modify: `src/pages/shop/ProductDetailPage.jsx`

**Interfaces:**
- Consumes: `fetchCatalog`, `buildFilters`, `findCategory`, `filterProducts` (Task 8)
- Produces: `useCatalog() -> { loading, error, categories, products, reload }`

C'est la tâche qui change le comportement visible du site. Après elle, la boutique n'affiche
plus rien qui ne vienne de la base.

- [ ] **Step 1: Écrire `src/hooks/useCatalog.js`**

```js
import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog } from '../api/catalog';

export function useCatalog() {
  const [state, setState] = useState({ loading: true, error: null, categories: [], products: [] });

  const load = useCallback(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetchCatalog()
      .then((data) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          categories: data?.categories ?? [],
          products: data?.products ?? [],
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, error, categories: [], products: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
}
```

- [ ] **Step 2: Écrire `src/components/shop/CatalogSkeleton.jsx`**

```jsx
export function CatalogSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden border-2 border-neutral-200 bg-white">
          <div className="aspect-square w-full animate-pulse bg-neutral-200" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 animate-pulse bg-neutral-200" />
            <div className="h-5 w-4/5 animate-pulse bg-neutral-200" />
            <div className="h-6 w-1/2 animate-pulse bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Écrire `src/components/shop/ErrorState.jsx`**

```jsx
import { RefreshCw, WifiOff } from 'lucide-react';

export function ErrorState({ error, onRetry }) {
  const offline = error?.status === 0;

  return (
    <div className="flex flex-col items-center gap-4 border-2 border-neutral-200 bg-white px-6 py-16 text-center">
      <WifiOff className="h-10 w-10 text-neutral-300" />
      <h3 className="font-['Archivo'] text-2xl font-black uppercase">
        {offline ? 'Serveur injoignable' : 'Catalogue indisponible'}
      </h3>
      <p className="max-w-md font-semibold text-neutral-600">
        {offline
          ? "Vérifiez votre connexion internet, puis réessayez."
          : error?.detail || "Le catalogue n'a pas pu être chargé."}
      </p>
      <button className="btn-skew p mt-2" onClick={onRetry}>
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Vider `src/data/shop.js`**

Le fichier ne conserve qu'une ligne :

```js
export const WA_NUMBER = '237693271126';
```

- [ ] **Step 5: Adapter `src/pages/shop/ShopHomePage.jsx`**

1. Remplacer la ligne d'import `import { categories, products, WA_NUMBER } from '../../data/shop';` par :

```jsx
import { WA_NUMBER } from '../../data/shop';
```

2. Changer la signature :

```jsx
export function ShopHomePage({ onAdd, products, categories }) {
```

3. Le produit vedette du héros est aujourd'hui `products[0]`, qui n'existe pas tant que le
catalogue n'est pas chargé. Ajouter juste après la signature :

```jsx
  const featured = products[0];
```

puis remplacer chaque occurrence de `products[0]` par `featured`, et entourer le bloc
`<a href={`#product/${products[0].id}`} className="hero-product-card">…</a>` d'une garde :

```jsx
          <div className="hero-product-stage">
            {featured && (
              <a href={`#product/${featured.id}`} className="hero-product-card">
                <img src={featured.image} alt={featured.name} />
                <div className="hero-product-info">
                  <span>Produit phare</span>
                  <b>{featured.name}</b>
                  <strong>{formatPrice(featured.price)}</strong>
                </div>
              </a>
            )}
          </div>
```

Noter que l'`alt` de l'image devient `featured.name` : il était figé sur « Valise
diagnostic professionnelle » alors que le produit affiché peut être n'importe lequel.

4. Le bloc « Ventes flash » utilise `products.slice(1, 5)` — cette expression est sûre sur
un tableau vide et n'a pas besoin de garde.

- [ ] **Step 6: Adapter `src/pages/shop/CategoryPage.jsx`**

Remplacer l'import et l'objet `filterSlugs` codé en dur (qui référence des catégories
inexistantes) par les dérivations de la Task 8.

```jsx
import { ProductCard } from '../../components/shop/ProductCard';
import { buildFilters, filterProducts, findCategory } from '../../utils/catalog';

export function CategoryPage({ slug, onAdd, products, categories }) {
  const activeSlug = slug || 'all';
  const category = findCategory(categories, activeSlug);
  const visibleProducts = filterProducts(products, activeSlug);
  const filters = buildFilters(categories);
```

Puis remplacer tout le bloc des puces de filtre par :

```jsx
          <div className="mb-10 flex gap-3 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <a
                key={filter.slug}
                className={`filter-chip ${activeSlug === filter.slug ? 'is-active' : ''}`}
                href={`#category/${filter.slug}`}
              >
                {filter.label}
              </a>
            ))}
          </div>
```

Enfin, afficher un message quand la catégorie est vide, juste après la grille :

```jsx
          {visibleProducts.length === 0 && (
            <p className="py-16 text-center font-semibold text-neutral-500">
              Aucun produit dans cette catégorie pour le moment.
            </p>
          )}
```

- [ ] **Step 7: Adapter `src/pages/shop/ProductDetailPage.jsx`**

Ajouter la prop `loading` et la tester **avant** le `if (!product)` existant, qui reste
inchangé.

```jsx
export function ProductDetailPage({ product, onAdd, loading }) {
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="aspect-square animate-pulse bg-neutral-200 lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="h-4 w-1/4 animate-pulse bg-neutral-200" />
            <div className="h-10 w-3/4 animate-pulse bg-neutral-200" />
            <div className="h-8 w-1/3 animate-pulse bg-neutral-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
```

Sans cette garde, un visiteur ouvrant un lien direct vers une fiche produit verrait « Ce
produit n'existe pas » pendant le chargement, avant que la page ne se corrige seule.

- [ ] **Step 8: Adapter `src/main.jsx`**

1. Remplacer `import { products } from './data/shop';` par :

```jsx
import { useCatalog } from './hooks/useCatalog';
import { CatalogSkeleton } from './components/shop/CatalogSkeleton';
import { ErrorState } from './components/shop/ErrorState';
```

2. Dans `App`, remplacer l'initialisation du panier et ajouter le catalogue :

```jsx
  const { loading, error, categories, products, reload } = useCatalog();
  const [route, setRoute] = useState(parseRoute);
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
```

Le panier démarrait avec `products[0]` déjà dedans, ce qui n'avait de sens qu'avec un
catalogue statique.

3. Remplacer le calcul de `selectedProduct` :

```jsx
  const selectedProduct =
    route.page === 'product' ? products.find((product) => product.id === route.id) ?? null : null;
```

4. Passer les données aux pages et gérer les états globaux :

```jsx
      <ShopHeader cartCount={cartCount} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      {error && route.page !== 'cart' ? (
        <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <ErrorState error={error} onRetry={reload} />
        </main>
      ) : (
        <>
          {route.page === 'home' &&
            (loading ? (
              <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <CatalogSkeleton />
              </main>
            ) : (
              <ShopHomePage onAdd={addToCart} products={products} categories={categories} />
            ))}
          {route.page === 'category' &&
            (loading ? (
              <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <CatalogSkeleton />
              </main>
            ) : (
              <CategoryPage slug={route.slug} onAdd={addToCart} products={products} categories={categories} />
            ))}
          {route.page === 'product' && (
            <ProductDetailPage product={selectedProduct} onAdd={addToCart} loading={loading} />
          )}
          {route.page === 'cart' && (
            <CartPage
              cart={cart}
              onAdd={(id) => updateQuantity(id, 1)}
              onSubtract={(id) => updateQuantity(id, -1)}
              onRemove={removeFromCart}
            />
          )}
        </>
      )}
      <ShopFooter />
```

Le panier reste accessible même si le catalogue est en erreur : ses lignes sont déjà en
mémoire et le client doit pouvoir finir sa commande.

- [ ] **Step 9: Vérification manuelle**

```bash
npm run dev
```

Ouvrir `http://localhost:5173/` et vérifier, un point après l'autre :

1. La page d'accueil affiche brièvement des placeholders gris, puis les produits venant de
   l'API. Le produit vedette du héros s'affiche.
2. Les catégories de la page d'accueil correspondent à celles de la base.
3. Cliquer sur une catégorie : les puces de filtre listent exactement les catégories
   existantes — plus de « Climatisation » ou « Freinage » fantômes.
4. Ouvrir une fiche produit directement par son URL (`http://localhost:5173/#product/<id>`
   dans un nouvel onglet) : un squelette s'affiche, puis la fiche. À aucun moment
   « Ce produit n'existe pas » n'apparaît.
5. Le panier est vide au premier chargement.
6. Couper le réseau (mode avion, ou arrêter le backend si vous êtes en local) puis
   recharger : le message « Serveur injoignable » s'affiche avec un bouton Réessayer.
   Rétablir le réseau, cliquer Réessayer : le catalogue se charge.
7. Ouvrir la console du navigateur : aucune erreur rouge.

- [ ] **Step 10: Vérifier que les tests passent toujours**

```bash
npm test
```

Attendu : 13 passed

- [ ] **Step 11: Commit**

```bash
git add src/
git commit -m "feat: load the shop catalog from the API"
```

---

## Task 10: Tunnel de commande

**Dépôt:** FRONTEND

**Files:**
- Create: `src/components/shop/CheckoutDialog.jsx`
- Modify: `src/pages/shop/CartPage.jsx`

**Interfaces:**
- Consumes: `createOrder` (Task 8), `fieldErrors` (Task 8)
- Produces: `<CheckoutDialog cart subtotal shipping onClose />`

- [ ] **Step 1: Écrire `src/components/shop/CheckoutDialog.jsx`**

```jsx
import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { fieldErrors } from '../../api/client';
import { createOrder } from '../../api/orders';
import { WA_NUMBER } from '../../data/shop';
import { formatPrice } from '../../utils/format';

const EMPTY = { customer_name: '', customer_phone: '', customer_city: '', note: '' };

export function CheckoutDialog({ cart, subtotal, shipping, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const openWhatsApp = (reference) => {
    const lines = [
      'Bonjour MR HONDA, je souhaite commander :',
      '',
      ...cart.map((item) => `- ${item.name} x${item.quantity} : ${formatPrice(item.price * item.quantity)}`),
      '',
      `Sous-total : ${formatPrice(subtotal)}`,
      `Livraison estimée : ${formatPrice(shipping)}`,
      `Total estimé : ${formatPrice(subtotal + shipping)}`,
      '',
      `Client : ${form.customer_name} — ${form.customer_phone}`,
    ];
    if (form.customer_city) lines.push(`Ville : ${form.customer_city}`);
    if (form.note) lines.push(`Note : ${form.note}`);
    if (reference) lines.push('', `Référence commande : ${reference}`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const result = await createOrder({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_city: form.customer_city.trim() || null,
        note: form.note.trim() || null,
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      });
      openWhatsApp(result.reference);
      onClose();
    } catch (error) {
      setErrors(fieldErrors(error.body));
      setMessage(error.detail || "L'enregistrement de la commande a échoué.");
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/70 p-0 sm:items-center sm:p-6">
      <div className="max-h-full w-full max-w-lg overflow-y-auto border-2 border-neutral-950 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="b-eyebrow">Finaliser</p>
            <h2 className="mt-2 font-['Archivo'] text-3xl font-black uppercase">Vos coordonnées</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-neutral-400 hover:text-red-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-3 font-semibold text-neutral-600">
          Nous enregistrons votre commande, puis WhatsApp s'ouvre avec le récapitulatif.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <CheckoutField
            label="Nom complet"
            value={form.customer_name}
            onChange={update('customer_name')}
            error={errors.customer_name}
            required
            minLength={2}
          />
          <CheckoutField
            label="Téléphone"
            type="tel"
            value={form.customer_phone}
            onChange={update('customer_phone')}
            error={errors.customer_phone}
            required
            minLength={6}
          />
          <CheckoutField
            label="Ville (optionnel)"
            value={form.customer_city}
            onChange={update('customer_city')}
            error={errors.customer_city}
          />
          <CheckoutField
            label="Note (optionnel)"
            value={form.note}
            onChange={update('note')}
            error={errors.note}
          />

          {message && (
            <p className="border-2 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800">{message}</p>
          )}

          <button type="submit" className="btn-whatsapp h-14 w-full px-5" disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {submitting ? 'Enregistrement…' : 'Valider et ouvrir WhatsApp'}
          </button>

          {failed && (
            <button
              type="button"
              className="w-full font-['Archivo'] text-sm font-black uppercase tracking-[.1em] text-neutral-500 underline hover:text-red-700"
              onClick={() => {
                openWhatsApp(null);
                onClose();
              }}
            >
              Continuer sur WhatsApp sans enregistrer
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function CheckoutField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
        {label}
      </span>
      <input
        {...props}
        className="mt-2 h-12 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
      />
      {error && <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span>}
    </label>
  );
}
```

L'échappatoire « Continuer sur WhatsApp sans enregistrer » n'apparaît qu'après un échec :
perdre une vente parce que la base est injoignable serait pire que perdre une ligne de
suivi.

- [ ] **Step 2: Brancher le dialogue dans `src/pages/shop/CartPage.jsx`**

1. Ajouter aux imports :

```jsx
import { useState } from 'react';
import { CheckoutDialog } from '../../components/shop/CheckoutDialog';
```

2. Supprimer entièrement la fonction `checkout` ainsi que l'import devenu inutile de
`WA_NUMBER` — c'est `CheckoutDialog` qui construit désormais le message WhatsApp.

3. Ajouter l'état, au début du composant :

```jsx
  const [checkoutOpen, setCheckoutOpen] = useState(false);
```

4. Remplacer le `onClick` du bouton :

```jsx
          <button className="btn-whatsapp mt-6 h-14 w-full px-5" disabled={!cart.length} onClick={() => setCheckoutOpen(true)}>
```

5. Juste avant la balise fermante `</main>`, ajouter :

```jsx
      {checkoutOpen && (
        <CheckoutDialog
          cart={cart}
          subtotal={subtotal}
          shipping={shipping}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
```

- [ ] **Step 3: Vérification manuelle**

```bash
npm run dev
```

1. Ajouter deux produits au panier, ouvrir `#panier`, cliquer « Commander sur WhatsApp ».
2. Le dialogue s'ouvre. Soumettre avec un nom vide : le navigateur bloque (champ `required`).
3. Saisir un nom d'une seule lettre et soumettre : le backend renvoie un `422` et le message
   d'erreur apparaît sous le champ « Nom complet ».
4. Saisir un nom et un téléphone valides, soumettre : un onglet WhatsApp s'ouvre avec le
   récapitulatif **et une ligne `Référence commande : MRH-…`**.
5. Vérifier que la commande est bien en base :

```bash
curl -s -X POST https://generalpolstermoebel-backend-production.up.railway.app/api/mrhonda/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@mrhonda.com\",\"password\":\"$MRHONDA_ADMIN_PASSWORD\"}"
```

Récupérer le token, puis :

```bash
curl -s https://generalpolstermoebel-backend-production.up.railway.app/api/mrhonda/admin/orders \
  -H "Authorization: Bearer <token>" | head -c 500
```

La commande doit apparaître avec le bon `total` et le bon nom.

6. Vérifier que le prix ne vient pas du navigateur : dans la console, exécuter

```js
await fetch(`${'https://generalpolstermoebel-backend-production.up.railway.app'}/api/mrhonda/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: 'Test Injection',
    customer_phone: '+237600000000',
    items: [{ id: '<un id réel>', quantity: 1, price: 1 }],
  }),
}).then((r) => r.json());
```

Le `total` renvoyé doit être le prix réel du produit, pas `1`.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: record orders before opening WhatsApp"
```

---

## Task 11: Route admin, session et connexion

**Dépôt:** FRONTEND

**Files:**
- Modify: `src/main.jsx`
- Create: `src/api/adminApi.js`
- Create: `src/pages/admin/useAdminAuth.js`
- Create: `src/pages/admin/ui.jsx`
- Create: `src/pages/admin/AdminApp.jsx`
- Create: `src/pages/admin/AdminLogin.jsx`
- Create: `src/pages/admin/AdminLayout.jsx`

**Interfaces:**
- Consumes: `apiFetch` (Task 8)
- Produces:
  - `useAdminAuth() -> { token, email, login(credentials), logout() }`
  - `<AdminApp tab />`, `<AdminLayout tab email onLogout>{children}</AdminLayout>`
  - `ui.jsx` : `<Field label error>{children}</Field>`, `<TextInput />`, `<Banner kind message onClose />`, `<ActionButton />`
  - `adminApi.js` : `listCategories(token)`, `createCategory(token, body)`, `updateCategory(token, slug, body)`, `deleteCategory(token, slug)`, `listProducts(token)`, `createProduct(token, body)`, `updateProduct(token, id, body)`, `deleteProduct(token, id)`, `listOrders(token, status)`, `updateOrderStatus(token, id, status)`, `uploadImage(token, file)`

- [ ] **Step 1: Séparer la boutique de l'application racine dans `src/main.jsx`**

Aujourd'hui `App` appelle ses hooks avant de décider quel site rendre : `useCatalog()`
partirait donc chercher le catalogue même sur la page admin et sur le site formation.
Déplacer tout le corps actuel de `App` dans un nouveau composant `ShopApp`, et réduire `App`
au routage.

```jsx
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';

const AdminApp = lazy(() => import('./pages/admin/AdminApp').then((m) => ({ default: m.AdminApp })));

const ADMIN_PATH = '/admin/123rvf';

function parseRoute() {
  const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  if (path === ADMIN_PATH) {
    return { site: 'admin', tab: window.location.hash.replace(/^#/, '') || 'produits' };
  }

  const hash = window.location.hash.replace(/^#/, '');

  if (hash === 'formation') return { site: 'formation', page: 'home' };
  if (hash === 'inscription') return { site: 'formation', page: 'register' };
  if (hash === 'filieres' || hash === 'parcours' || hash === 'diagnostic') {
    return { site: 'formation', page: 'home', anchor: hash };
  }
  if (hash === 'panier') return { site: 'shop', page: 'cart' };
  if (hash === 'promos' || hash === 'categories') return { site: 'shop', page: 'home', anchor: hash };
  if (hash.startsWith('category/')) return { site: 'shop', page: 'category', slug: hash.split('/')[1] || 'all' };
  if (hash.startsWith('product/')) return { site: 'shop', page: 'product', id: hash.split('/')[1] };

  return { site: 'shop', page: 'home' };
}

function App() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  if (route.site === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center font-['Archivo'] font-black uppercase">
            Chargement du dashboard…
          </div>
        }
      >
        <AdminApp tab={route.tab} />
      </Suspense>
    );
  }

  if (route.site === 'formation') {
    return <FormationSite initialPage={route.page} anchor={route.anchor} />;
  }

  return <ShopApp route={route} />;
}
```

`ShopApp` reprend exactement l'état et le JSX que `App` contenait à la fin de la Task 9
(catalogue, panier, menu, gestion du défilement vers les ancres), avec `route` en prop :

```jsx
function ShopApp({ route }) {
  const { loading, error, categories, products, reload } = useCatalog();
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    if (!route.anchor) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.requestAnimationFrame(() => {
        document.getElementById(route.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [route]);

  // addToCart, updateQuantity, removeFromCart, cartCount et selectedProduct :
  // déplacer les définitions telles quelles depuis App, sans les modifier.
  // Le JSX de retour est celui écrit au Step 8 de la Task 9, également déplacé tel quel.
}
```

Le `setMenuOpen(false)` et le défilement, qui vivaient dans l'écouteur `hashchange`,
deviennent un effet sur `route` : `App` ne connaît plus l'état du menu.

Ajouter l'écouteur `popstate` est nécessaire pour que le retour arrière du navigateur depuis
`/admin/123rvf` vers la boutique fonctionne.

- [ ] **Step 2: Écrire `src/api/adminApi.js`**

```js
import { apiFetch } from './client';

const BASE = '/api/mrhonda/admin';

export const listCategories = (token) => apiFetch(`${BASE}/categories`, { token });
export const createCategory = (token, body) => apiFetch(`${BASE}/categories`, { method: 'POST', token, body });
export const updateCategory = (token, slug, body) =>
  apiFetch(`${BASE}/categories/${encodeURIComponent(slug)}`, { method: 'PUT', token, body });
export const deleteCategory = (token, slug) =>
  apiFetch(`${BASE}/categories/${encodeURIComponent(slug)}`, { method: 'DELETE', token });

export const listProducts = (token) => apiFetch(`${BASE}/products`, { token });
export const createProduct = (token, body) => apiFetch(`${BASE}/products`, { method: 'POST', token, body });
export const updateProduct = (token, id, body) =>
  apiFetch(`${BASE}/products/${encodeURIComponent(id)}`, { method: 'PUT', token, body });
export const deleteProduct = (token, id) =>
  apiFetch(`${BASE}/products/${encodeURIComponent(id)}`, { method: 'DELETE', token });

export const listOrders = (token, status) =>
  apiFetch(`${BASE}/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token });
export const updateOrderStatus = (token, id, status) =>
  apiFetch(`${BASE}/orders/${id}/status`, { method: 'PATCH', token, body: { status } });

export const uploadImage = (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`${BASE}/media`, { method: 'POST', token, formData });
};
```

- [ ] **Step 3: Écrire `src/pages/admin/useAdminAuth.js`**

```js
import { useCallback, useState } from 'react';
import { apiFetch } from '../../api/client';

const TOKEN_KEY = 'mrhonda_admin_token';
const EMAIL_KEY = 'mrhonda_admin_email';

function read(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // navigation privée ou stockage bloqué : la session vit alors en mémoire seulement
  }
}

export function useAdminAuth() {
  const [token, setToken] = useState(() => read(TOKEN_KEY));
  const [email, setEmail] = useState(() => read(EMAIL_KEY));

  const login = useCallback(async (credentials) => {
    const data = await apiFetch('/api/mrhonda/auth/login', { method: 'POST', body: credentials });
    write(TOKEN_KEY, data.token);
    write(EMAIL_KEY, data.email);
    setToken(data.token);
    setEmail(data.email);
  }, []);

  const logout = useCallback(() => {
    write(TOKEN_KEY, null);
    write(EMAIL_KEY, null);
    setToken(null);
    setEmail(null);
  }, []);

  return { token, email, login, logout };
}
```

- [ ] **Step 4: Écrire `src/pages/admin/ui.jsx`**

Ces primitives sont partagées par tous les panneaux du dashboard. Les écrire une fois ici
évite de répéter les mêmes classes Tailwind dans six fichiers.

```jsx
import { Loader2, X } from 'lucide-react';

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs font-semibold text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span>}
    </label>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="mt-2 h-11 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none disabled:bg-neutral-100"
    />
  );
}

export function SelectInput({ children, ...props }) {
  return (
    <select
      {...props}
      className="mt-2 h-11 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
    >
      {children}
    </select>
  );
}

export function Banner({ kind = 'info', message, onClose }) {
  if (!message) return null;
  const tone =
    kind === 'error'
      ? 'border-red-700 bg-red-50 text-red-800'
      : 'border-emerald-700 bg-emerald-50 text-emerald-800';
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 border-2 px-4 py-3 font-semibold ${tone}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ActionButton({ busy, className = '', children, ...props }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] text-white hover:bg-red-700 hover:border-red-700 disabled:opacity-50 ${className}`}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Écrire `src/pages/admin/AdminLogin.jsx`**

```jsx
import { useState } from 'react';
import { ActionButton, Banner, Field, TextInput } from './ui';

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin({ email: email.trim(), password });
    } catch (failure) {
      setError(failure.detail || 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5">
      <form onSubmit={submit} className="w-full max-w-sm border-2 border-white bg-white p-7">
        <p className="b-eyebrow">MR HONDA</p>
        <h1 className="mt-2 font-['Archivo'] text-3xl font-black uppercase">Administration</h1>
        <Banner kind="error" message={error} />
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Mot de passe">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>
        <ActionButton type="submit" busy={busy} className="mt-6 w-full">
          Se connecter
        </ActionButton>
      </form>
    </main>
  );
}
```

Le `Banner` est placé avant les champs pour qu'un message d'erreur soit visible sans faire
défiler la page sur un téléphone.

- [ ] **Step 6: Écrire `src/pages/admin/AdminLayout.jsx`**

```jsx
import { LogOut } from 'lucide-react';

const TABS = [
  { id: 'produits', label: 'Produits' },
  { id: 'categories', label: 'Catégories' },
  { id: 'commandes', label: 'Commandes' },
];

export function AdminLayout({ tab, email, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <header className="border-b-2 border-neutral-950 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="b-eyebrow">MR HONDA</p>
            <h1 className="font-['Archivo'] text-2xl font-black uppercase">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-neutral-500 sm:inline">{email}</span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 px-5 sm:px-8">
          {TABS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`border-b-4 px-4 py-3 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] ${
                tab === item.id ? 'border-red-700 text-red-700' : 'border-transparent text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 7: Écrire `src/pages/admin/AdminApp.jsx`**

Les trois panneaux n'existent pas encore : cette version les remplace par un texte, que les
Tasks 12 à 14 remplaceront un par un.

```jsx
import { useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { useAdminAuth } from './useAdminAuth';

export function AdminApp({ tab }) {
  const { token, email, login, logout } = useAdminAuth();

  const request = useCallback(
    async (call) => {
      try {
        return await call(token);
      } catch (error) {
        if (error.status === 401) logout();
        throw error;
      }
    },
    [token, logout],
  );

  if (!token) return <AdminLogin onLogin={login} />;

  return (
    <AdminLayout tab={tab} email={email} onLogout={logout}>
      {tab === 'produits' && <p className="font-semibold text-neutral-500">Panneau produits — Task 12</p>}
      {tab === 'categories' && <p className="font-semibold text-neutral-500">Panneau catégories — Task 13</p>}
      {tab === 'commandes' && <p className="font-semibold text-neutral-500">Panneau commandes — Task 14</p>}
    </AdminLayout>
  );
}
```

`request` n'est pas encore utilisé ; il le sera par les trois panneaux. Il centralise la
règle « un 401 met fin à la session », pour qu'aucun panneau n'ait à y penser.

- [ ] **Step 8: Vérification manuelle**

```bash
npm run dev
```

1. Ouvrir `http://localhost:5173/admin/123rvf` : l'écran de connexion s'affiche.
2. Se tromper de mot de passe : « Email ou mot de passe incorrect ».
3. Se tromper 5 fois de suite : le message devient « Trop de tentatives… ». Attendre ou
   redémarrer le backend pour la suite.
4. Se connecter avec `admin@mrhonda.com` : le layout apparaît avec les trois onglets.
5. Cliquer sur chaque onglet : l'URL devient `/admin/123rvf#categories` etc. et l'onglet
   actif change. Recharger la page sur cet URL : le bon onglet reste sélectionné.
6. Cliquer « Déconnexion » : retour à l'écran de connexion.
7. Se reconnecter, puis fermer l'onglet et rouvrir `/admin/123rvf` : la connexion est
   redemandée (c'est bien `sessionStorage` et non `localStorage`).
8. Ouvrir l'onglet Réseau des outils de développement, aller sur `http://localhost:5173/`
   (la boutique) : **aucun fichier du dashboard ne doit être téléchargé**. C'est ce que
   vérifie le `React.lazy`.
9. Vérifier qu'aucun appel à `/api/mrhonda/catalog` n'est déclenché sur `/admin/123rvf`.

- [ ] **Step 9: Vérifier le build de production**

```bash
npm run build
```

Attendu : le build réussit et la sortie liste un chunk séparé pour `AdminApp`.

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: add admin route with scoped session and login"
```

---

## Task 12: Panneau produits

**Dépôt:** FRONTEND

**Files:**
- Create: `src/pages/admin/ImageField.jsx`
- Create: `src/pages/admin/ProductForm.jsx`
- Create: `src/pages/admin/ProductsPanel.jsx`
- Modify: `src/pages/admin/AdminApp.jsx`

**Interfaces:**
- Consumes: `adminApi` (Task 11), `ui.jsx` (Task 11), `request` fourni par `AdminApp`
- Produces:
  - `<ImageField value onChange token />`
  - `<ProductForm product categories onSubmit onCancel busy errors />`
  - `<ProductsPanel request />`

- [ ] **Step 1: Écrire `src/pages/admin/ImageField.jsx`**

```jsx
import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '../../api/adminApi';
import { Field, TextInput } from './ui';

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageField({ value, onChange, token, error }) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Seules les images sont acceptées.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`Image trop lourde (${Math.round(file.size / 1024 / 1024)} Mo). Maximum 5 Mo.`);
      return;
    }

    setBusy(true);
    setUploadError('');
    try {
      const asset = await uploadImage(token, file);
      onChange(asset.url);
    } catch (failure) {
      setUploadError(failure.detail || "L'envoi de l'image a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="Image" error={error || uploadError} hint="Téléversez un fichier ou collez une URL.">
        <TextInput
          type="url"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://res.cloudinary.com/..."
        />
      </Field>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 border-2 border-neutral-300 px-4 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:border-neutral-950 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? 'Envoi…' : 'Téléverser'}
        </button>
        {value && (
          <img src={value} alt="" className="h-14 w-14 border-2 border-neutral-200 object-cover" />
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}
```

`event.target.value = ''` juste après la lecture du fichier permet de re-sélectionner le
même fichier après un échec : sans cela, le navigateur ne redéclenche pas `change`.

- [ ] **Step 2: Écrire `src/pages/admin/ProductForm.jsx`**

```jsx
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ActionButton, Field, SelectInput, TextInput } from './ui';
import { ImageField } from './ImageField';

const EMPTY = {
  name: '',
  category_slug: '',
  price: '',
  old_price: '',
  badge: '',
  rating: 0,
  specs: [],
  image: '',
  visible: true,
  position: 0,
};

function toForm(product) {
  if (!product) return EMPTY;
  return {
    name: product.name,
    category_slug: product.category_slug,
    price: String(product.price),
    old_price: product.old_price === null ? '' : String(product.old_price),
    badge: product.badge ?? '',
    rating: product.rating,
    specs: product.specs ?? [],
    image: product.image ?? '',
    visible: product.visible,
    position: product.position,
  };
}

export function ProductForm({ product, categories, token, busy, errors, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(product));

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const setSpec = (index, text) =>
    setForm({ ...form, specs: form.specs.map((spec, i) => (i === index ? text : spec)) });

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      category_slug: form.category_slug,
      price: Number(form.price),
      old_price: form.old_price === '' ? null : Number(form.old_price),
      badge: form.badge.trim() || null,
      rating: Number(form.rating),
      specs: form.specs.map((spec) => spec.trim()).filter(Boolean),
      image: form.image.trim() || null,
      visible: form.visible,
      position: Number(form.position),
    });
  };

  return (
    <form onSubmit={submit} className="border-2 border-neutral-950 bg-white p-6">
      <h2 className="font-['Archivo'] text-2xl font-black uppercase">
        {product ? 'Modifier le produit' : 'Nouveau produit'}
      </h2>
      {product && (
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Identifiant : <code>{product.id}</code> — non modifiable, il sert aux liens partagés.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Nom" error={errors.name}>
          <TextInput value={form.name} onChange={set('name')} required maxLength={120} />
        </Field>

        <Field label="Catégorie" error={errors.category_slug}>
          <SelectInput value={form.category_slug} onChange={set('category_slug')} required>
            <option value="">Choisir…</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Prix (FCFA)" error={errors.price}>
          <TextInput type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
        </Field>

        <Field label="Ancien prix (optionnel)" error={errors.old_price}>
          <TextInput type="number" min="0" step="1" value={form.old_price} onChange={set('old_price')} />
        </Field>

        <Field label="Badge (optionnel)" error={errors.badge}>
          <TextInput value={form.badge} onChange={set('badge')} maxLength={20} placeholder="PROMO" />
        </Field>

        <Field label="Note (0 à 5)" error={errors.rating}>
          <TextInput type="number" min="0" max="5" step="1" value={form.rating} onChange={set('rating')} />
        </Field>

        <Field label="Position d'affichage" error={errors.position} hint="0 en premier. Le produit en position 0 est mis en avant sur l'accueil.">
          <TextInput type="number" min="0" max="999" step="1" value={form.position} onChange={set('position')} />
        </Field>

        <label className="flex items-end gap-3 pb-2">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(event) => setForm({ ...form, visible: event.target.checked })}
            className="h-5 w-5"
          />
          <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em]">
            Visible sur le site
          </span>
        </label>
      </div>

      <div className="mt-5">
        <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} token={token} error={errors.image} />
      </div>

      <div className="mt-6">
        <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
          Points forts
        </span>
        {errors.specs && <p className="mt-1 text-sm font-semibold text-red-700">{errors.specs}</p>}
        <div className="mt-2 space-y-2">
          {form.specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={spec}
                maxLength={120}
                onChange={(event) => setSpec(index, event.target.value)}
                className="h-11 flex-1 border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Retirer"
                onClick={() => setForm({ ...form, specs: form.specs.filter((_, i) => i !== index) })}
                className="border-2 border-neutral-300 px-3 text-neutral-400 hover:border-red-700 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {form.specs.length < 12 && (
          <button
            type="button"
            onClick={() => setForm({ ...form, specs: [...form.specs, ''] })}
            className="mt-3 inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:text-red-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un point fort
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <ActionButton type="submit" busy={busy}>
          {product ? 'Enregistrer' : 'Créer'}
        </ActionButton>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 border-2 border-neutral-300 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] hover:border-neutral-950"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Écrire `src/pages/admin/ProductsPanel.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../../api/adminApi';
import { fieldErrors } from '../../api/client';
import { formatPrice } from '../../utils/format';
import { ActionButton, Banner } from './ui';
import { ProductForm } from './ProductForm';

export function ProductsPanel({ request, token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | produit
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        request(listProducts),
        request(listCategories),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (failure) {
      setError(failure.detail || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload) => {
    setBusy(true);
    setErrors({});
    setError('');
    try {
      if (editing === 'new') {
        await request((t) => createProduct(t, payload));
        setNotice('Produit créé.');
      } else {
        await request((t) => updateProduct(t, editing.id, payload));
        setNotice('Produit enregistré.');
      }
      setEditing(null);
      await load();
    } catch (failure) {
      setErrors(fieldErrors(failure.body));
      setError(failure.detail || 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Supprimer définitivement « ${product.name} » ?`)) return;
    setError('');
    try {
      await request((t) => deleteProduct(t, product.id));
      setNotice('Produit supprimé.');
      await load();
    } catch (failure) {
      setError(failure.detail || 'Suppression impossible');
    }
  };

  if (loading) return <p className="font-semibold text-neutral-500">Chargement…</p>;

  if (editing) {
    return (
      <>
        <Banner kind="error" message={error} onClose={() => setError('')} />
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          token={token}
          busy={busy}
          errors={errors}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setErrors({});
            setError('');
          }}
        />
      </>
    );
  }

  return (
    <>
      <Banner kind="error" message={error} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      {categories.length === 0 ? (
        <div className="border-2 border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-neutral-600">
            Créez d'abord une catégorie : un produit doit appartenir à une catégorie existante.
          </p>
          <a href="#categories" className="btn-skew p mt-5 inline-flex">
            <span>Aller aux catégories</span>
          </a>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-semibold text-neutral-500">
              {products.length} produit{products.length > 1 ? 's' : ''}
            </p>
            <ActionButton onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              Nouveau produit
            </ActionButton>
          </div>

          <div className="overflow-x-auto border-2 border-neutral-950 bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b-2 border-neutral-950">
                <tr className="font-['Archivo'] text-xs font-black uppercase tracking-[.1em]">
                  <th className="p-3">Image</th>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Visible</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-neutral-200 last:border-0">
                    <td className="p-3">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-12 w-12 border border-neutral-200 object-cover" />
                      ) : (
                        <div className="h-12 w-12 bg-neutral-100" />
                      )}
                    </td>
                    <td className="p-3 font-semibold">{product.name}</td>
                    <td className="p-3 text-neutral-600">{product.category_title}</td>
                    <td className="p-3 font-bold">{formatPrice(product.price)}</td>
                    <td className="p-3">
                      <span className={product.visible ? 'text-emerald-700' : 'text-neutral-400'}>
                        {product.visible ? 'Oui' : 'Masqué'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(product)} aria-label={`Modifier ${product.name}`} className="hover:text-red-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(product)} aria-label={`Supprimer ${product.name}`} className="text-neutral-400 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center font-semibold text-neutral-500">
                      Aucun produit. Cliquez sur « Nouveau produit ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 4: Brancher le panneau dans `AdminApp.jsx`**

Remplacer la ligne d'espace réservé de l'onglet produits :

```jsx
import { ProductsPanel } from './ProductsPanel';
```

```jsx
      {tab === 'produits' && <ProductsPanel request={request} token={token} />}
```

- [ ] **Step 5: Vérification manuelle**

Se connecter sur `/admin/123rvf`, onglet Produits :

1. Le tableau liste les produits amorcés en Task 7, avec leur catégorie et leur prix.
2. « Nouveau produit » : le formulaire s'ouvre, le select des catégories est rempli.
3. Soumettre avec un prix négatif : le champ « Prix » affiche l'erreur venue du backend.
4. Créer un produit valide avec deux points forts et une image téléversée. Vérifier que
   l'aperçu de l'image s'affiche avant l'enregistrement.
5. Le produit apparaît dans le tableau avec le message « Produit créé. »
6. Ouvrir la boutique dans un autre onglet : le produit est visible.
7. Modifier le produit, décocher « Visible sur le site », enregistrer. Recharger la
   boutique : le produit a disparu du site public mais reste dans le tableau, marqué
   « Masqué ».
8. Supprimer le produit : la confirmation apparaît, puis il disparaît.
9. Téléverser un fichier de plus de 5 Mo : le message « Image trop lourde » apparaît sans
   qu'aucune requête ne parte (vérifier dans l'onglet Réseau).
10. Téléverser un fichier qui n'est pas une image : « Seules les images sont acceptées. »

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add product management panel"
```

---

## Task 13: Panneau catégories

**Dépôt:** FRONTEND

**Files:**
- Create: `src/pages/admin/CategoryForm.jsx`
- Create: `src/pages/admin/CategoriesPanel.jsx`
- Modify: `src/pages/admin/AdminApp.jsx`

**Interfaces:**
- Consumes: `adminApi`, `ui.jsx`, `ImageField` (Task 12)
- Produces: `<CategoriesPanel request token />`

- [ ] **Step 1: Écrire `src/pages/admin/CategoryForm.jsx`**

```jsx
import { useState } from 'react';
import { ActionButton, Field, TextInput } from './ui';
import { ImageField } from './ImageField';

const EMPTY = { title: '', text: '', image: '', position: 0 };

export function CategoryForm({ category, token, busy, errors, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    category
      ? {
          title: category.title,
          text: category.text ?? '',
          image: category.image ?? '',
          position: category.position,
        }
      : EMPTY,
  );

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title.trim(),
      text: form.text.trim(),
      image: form.image.trim() || null,
      position: Number(form.position),
    });
  };

  return (
    <form onSubmit={submit} className="border-2 border-neutral-950 bg-white p-6">
      <h2 className="font-['Archivo'] text-2xl font-black uppercase">
        {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      </h2>
      {category && (
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Slug : <code>{category.slug}</code> — non modifiable, il sert aux liens partagés.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Titre" error={errors.title}>
          <TextInput value={form.title} onChange={set('title')} required maxLength={80} />
        </Field>
        <Field label="Position d'affichage" error={errors.position} hint="0 en premier.">
          <TextInput type="number" min="0" max="999" step="1" value={form.position} onChange={set('position')} />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Description" error={errors.text}>
          <textarea
            value={form.text}
            onChange={set('text')}
            maxLength={400}
            rows={3}
            className="mt-2 w-full border-2 border-neutral-300 p-3 font-semibold focus:border-neutral-950 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5">
        <ImageField value={form.image} onChange={(url) => setForm({ ...form, image: url })} token={token} error={errors.image} />
      </div>

      <div className="mt-8 flex gap-3">
        <ActionButton type="submit" busy={busy}>
          {category ? 'Enregistrer' : 'Créer'}
        </ActionButton>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 border-2 border-neutral-300 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] hover:border-neutral-950"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Écrire `src/pages/admin/CategoriesPanel.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../../api/adminApi';
import { fieldErrors } from '../../api/client';
import { ActionButton, Banner } from './ui';
import { CategoryForm } from './CategoryForm';

export function CategoriesPanel({ request, token }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await request(listCategories));
    } catch (failure) {
      setError(failure.detail || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload) => {
    setBusy(true);
    setErrors({});
    setError('');
    try {
      if (editing === 'new') {
        await request((t) => createCategory(t, payload));
        setNotice('Catégorie créée.');
      } else {
        await request((t) => updateCategory(t, editing.slug, payload));
        setNotice('Catégorie enregistrée.');
      }
      setEditing(null);
      await load();
    } catch (failure) {
      setErrors(fieldErrors(failure.body));
      setError(failure.detail || 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Supprimer la catégorie « ${category.title} » ?`)) return;
    setError('');
    try {
      await request((t) => deleteCategory(t, category.slug));
      setNotice('Catégorie supprimée.');
      await load();
    } catch (failure) {
      setError(failure.detail || 'Suppression impossible');
    }
  };

  if (loading) return <p className="font-semibold text-neutral-500">Chargement…</p>;

  if (editing) {
    return (
      <>
        <Banner kind="error" message={error} onClose={() => setError('')} />
        <CategoryForm
          category={editing === 'new' ? null : editing}
          token={token}
          busy={busy}
          errors={errors}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setErrors({});
            setError('');
          }}
        />
      </>
    );
  }

  return (
    <>
      <Banner kind="error" message={error} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-semibold text-neutral-500">
          {categories.length} catégorie{categories.length > 1 ? 's' : ''}
        </p>
        <ActionButton onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </ActionButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article key={category.slug} className="border-2 border-neutral-950 bg-white">
            {category.image ? (
              <img src={category.image} alt="" className="h-32 w-full object-cover" />
            ) : (
              <div className="h-32 w-full bg-neutral-100" />
            )}
            <div className="p-4">
              <h3 className="font-['Archivo'] text-lg font-black uppercase">{category.title}</h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Position {category.position} · {category.product_count} produit
                {category.product_count > 1 ? 's' : ''}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{category.text}</p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setEditing(category)} className="inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:text-red-700">
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
                <button onClick={() => remove(category)} className="inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] text-neutral-400 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
        {categories.length === 0 && (
          <p className="col-span-full border-2 border-neutral-300 bg-white p-8 text-center font-semibold text-neutral-500">
            Aucune catégorie. Créez-en une pour pouvoir ajouter des produits.
          </p>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Brancher le panneau dans `AdminApp.jsx`**

```jsx
import { CategoriesPanel } from './CategoriesPanel';
```

```jsx
      {tab === 'categories' && <CategoriesPanel request={request} token={token} />}
```

- [ ] **Step 4: Vérification manuelle**

1. L'onglet Catégories liste les trois catégories amorcées avec leur nombre de produits.
2. Créer une catégorie « Freinage » : elle apparaît, avec 0 produit.
3. Ouvrir la boutique : « Freinage » apparaît dans les puces de filtre de la page catégorie
   et dans la grille des catégories de l'accueil.
4. Supprimer « Freinage » (vide) : elle disparaît.
5. Tenter de supprimer « Pièces moteur » qui contient des produits : le bandeau rouge
   affiche « N produits utilisent cette catégorie » et la catégorie reste en place.
6. Modifier le titre de « Diagnostic » en « Diagnostic auto », enregistrer, puis recharger
   la boutique : **tous les produits de cette catégorie affichent le nouveau libellé**.
   C'est la vérification de la normalisation décidée dans le spec.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add category management panel"
```

---

## Task 14: Panneau commandes

**Dépôt:** FRONTEND

**Files:**
- Create: `src/pages/admin/OrdersPanel.jsx`
- Modify: `src/pages/admin/AdminApp.jsx`

**Interfaces:**
- Consumes: `listOrders`, `updateOrderStatus` (Task 11)
- Produces: `<OrdersPanel request />`

- [ ] **Step 1: Écrire `src/pages/admin/OrdersPanel.jsx`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { listOrders, updateOrderStatus } from '../../api/adminApi';
import { formatPrice } from '../../utils/format';
import { Banner, SelectInput } from './ui';

const STATUSES = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'traitee', label: 'Traitée' },
  { value: 'annulee', label: 'Annulée' },
];

const FILTERS = [{ value: '', label: 'Toutes' }, ...STATUSES];

function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function OrdersPanel({ request }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await request((token) => listOrders(token, filter || undefined)));
    } catch (failure) {
      setError(failure.detail || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [request, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order, status) => {
    setError('');
    try {
      await request((token) => updateOrderStatus(token, order.id, status));
      setNotice(`Commande ${order.reference} : ${status}.`);
      await load();
    } catch (failure) {
      setError(failure.detail || 'Changement de statut impossible');
    }
  };

  return (
    <>
      <Banner kind="error" message={error} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="font-semibold text-neutral-500">
          {loading ? 'Chargement…' : `${orders.length} commande${orders.length > 1 ? 's' : ''}`}
        </p>
        <label className="flex items-center gap-3">
          <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
            Statut
          </span>
          <div className="w-44">
            <SelectInput value={filter} onChange={(event) => setFilter(event.target.value)}>
              {FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </label>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="border-2 border-neutral-950 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
                  {order.reference} · {formatDate(order.created_at)}
                </p>
                <p className="mt-1 font-['Archivo'] text-lg font-black uppercase">{order.customer_name}</p>
                <a href={`tel:${order.customer_phone}`} className="font-semibold text-neutral-600 hover:text-red-700">
                  {order.customer_phone}
                </a>
                {order.customer_city && (
                  <span className="ml-2 font-semibold text-neutral-400">· {order.customer_city}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.1em] text-neutral-400">Total articles</p>
                  <strong className="font-['Archivo'] text-xl text-red-700">{formatPrice(order.total)}</strong>
                </div>
                <div className="w-40">
                  <SelectInput value={order.status} onChange={(event) => changeStatus(order, event.target.value)}>
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  aria-label="Voir les articles"
                  aria-expanded={expanded === order.id}
                  className="text-neutral-400 hover:text-neutral-950"
                >
                  {expanded === order.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {expanded === order.id && (
              <div className="border-t-2 border-neutral-200 bg-[#f9f9f8] p-4">
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between gap-4 font-semibold">
                      <span>
                        {item.name} <span className="text-neutral-500">x{item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {order.note && (
                  <p className="mt-4 border-l-4 border-neutral-300 pl-3 font-semibold text-neutral-600">
                    {order.note}
                  </p>
                )}
              </div>
            )}
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <p className="border-2 border-neutral-300 bg-white p-8 text-center font-semibold text-neutral-500">
            Aucune commande {filter ? 'avec ce statut' : 'pour le moment'}.
          </p>
        )}
      </div>
    </>
  );
}
```

Les articles sont affichés avec le prix enregistré au moment de la commande, pas le prix
actuel du produit : c'est tout l'intérêt du snapshot décidé dans le spec.

- [ ] **Step 2: Brancher le panneau dans `AdminApp.jsx`**

```jsx
import { OrdersPanel } from './OrdersPanel';
```

```jsx
      {tab === 'commandes' && <OrdersPanel request={request} />}
```

- [ ] **Step 3: Vérification manuelle**

1. L'onglet Commandes liste la commande passée en Task 10, avec sa référence et son total.
2. Déplier la commande : les articles apparaissent avec leur prix unitaire d'achat.
3. Passer le statut à « Traitée » : le message de confirmation apparaît.
4. Filtrer sur « Nouvelle » : la commande n'apparaît plus. Filtrer sur « Traitée » : elle
   réapparaît.
5. **Test du snapshot** : modifier le prix de ce produit dans l'onglet Produits, revenir aux
   commandes, déplier : le prix affiché est resté celui du moment de la commande.
6. Passer une nouvelle commande depuis la boutique, revenir au dashboard, recharger : elle
   apparaît en tête de liste.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: add orders panel"
```

---

# Phase 3 — Mise en production

## Task 15: Configuration Railway et vérification finale

**Dépôt:** les deux

**Files:**
- Aucun fichier modifié : cette tâche est une configuration de plateforme suivie d'une
  recette de vérification.

**Interfaces:**
- Consumes: tout ce qui précède
- Produces: rien pour le code

**Point subtil sur `VITE_API_BASE_URL`.** Les variables `VITE_*` sont normalement figées au
moment du build. Ici, le `Dockerfile` du FRONTEND lance `npm start`, qui exécute
`vite build && vite preview` **au démarrage du conteneur** : les variables d'environnement
Railway sont donc bien présentes au moment du build. Aucun argument de build à configurer.

- [ ] **Step 1: Configurer les variables du BACKEND sur Railway**

Dans le service `generalpolstermoebel-backend`, onglet Variables :

1. Modifier `CORS_ORIGINS` pour y ajouter l'URL de production du frontend mrhonda, séparée
   par une virgule, sans espace autour. Sa valeur actuelle est :

```
http://localhost:5173,http://127.0.0.1:5173,https://generalpolstermoebel-production.up.railway.app/,https://generalpolstermoebel-production.up.railway.app
```

Y ajouter `,https://<domaine-mrhonda>.up.railway.app`. Sans cette étape le navigateur
bloquera tous les appels et la boutique restera vide en production.

2. Ajouter `MRHONDA_TOKEN_SECRET` avec une valeur aléatoire :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Un secret distinct de `ADMIN_TOKEN_SECRET` rend les signatures des deux dashboards
mutuellement invalides, en plus de l'isolation par scope.

**Attention :** changer ce secret invalide immédiatement toutes les sessions admin mrhonda
en cours. Le faire avant la mise en service, pas après.

3. Redéployer le service pour appliquer les variables.

- [ ] **Step 2: Configurer les variables du FRONTEND sur Railway**

Dans le service mrhonda, ajouter :

```
VITE_API_BASE_URL=https://generalpolstermoebel-backend-production.up.railway.app
```

- [ ] **Step 3: Déployer le frontend**

```bash
cd /Users/macbookpro/Desktop/dev/mrhonda
git push origin main
```

Attendre la fin du déploiement Railway.

- [ ] **Step 4: Recette de production**

Sur l'URL de production du frontend, dérouler la liste complète :

1. La boutique affiche les produits venant de la base.
2. Ouvrir la console : aucune erreur CORS. Si `Access-Control-Allow-Origin` est signalé,
   reprendre le Step 1.
3. Naviguer vers une catégorie, ouvrir une fiche produit, ajouter au panier.
4. Passer une commande de test complète : le dialogue s'ouvre, WhatsApp s'ouvre avec la
   référence.
5. Ouvrir `/admin/123rvf` **en tapant l'URL directement** (pas via un lien) : la page se
   charge — c'est le fallback SPA de `vite preview` qui est vérifié ici. Si une erreur 404
   apparaît, le problème vient de la configuration du service, pas du code.
6. Se connecter, vérifier les trois onglets.
7. Créer un produit de test, le voir apparaître sur la boutique, puis le supprimer.
8. Vérifier la commande de test dans l'onglet Commandes, la passer en « Traitée ».
9. Vérifier que le site generalpolstermoebel fonctionne toujours, et que son dashboard
   `/dr_h123` accepte toujours son propre compte.

- [ ] **Step 5: Vérifier l'isolation en production**

```bash
TOKEN=$(curl -s -X POST https://generalpolstermoebel-backend-production.up.railway.app/api/mrhonda/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"admin@mrhonda.com\",\"password\":\"$MRHONDA_ADMIN_PASSWORD\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')

curl -s -o /dev/null -w 'contenu gpm avec token mrhonda : %{http_code}\n' \
  https://generalpolstermoebel-backend-production.up.railway.app/api/admin/content \
  -H "Authorization: Bearer $TOKEN"

curl -s -o /dev/null -w 'produits mrhonda sans token : %{http_code}\n' \
  https://generalpolstermoebel-backend-production.up.railway.app/api/mrhonda/admin/products
```

Attendu : `401` sur les deux lignes. Toute autre réponse est une faille à corriger avant de
livrer.

- [ ] **Step 6: Changer le mot de passe administrateur**

Le mot de passe initial suit un motif de dictionnaire courant (nom du site, `@`, `123`).
Une fois la
recette passée :

```bash
cd /Users/macbookpro/Desktop/dev/generalpolstermoebel/backend
MRHONDA_ADMIN_PASSWORD='<un mot de passe long et aléatoire>' .venv/bin/python scripts/seed_mrhonda.py
```

Le script met à jour le mot de passe de l'admin existant sans toucher au catalogue.
Vérifier ensuite qu'une connexion avec l'ancien mot de passe échoue et qu'elle réussit avec
le nouveau.

- [ ] **Step 7: Nettoyer les données de test**

Supprimer depuis le dashboard les produits de test créés pendant la recette, et passer les
commandes de test en « Annulée ».

---

# Récapitulatif

| # | Tâche | Dépôt | Livrable vérifiable |
|---|---|---|---|
| 1 | Outillage de test et slugs | BACKEND | 7 tests verts |
| 2 | Authentification scopée | BACKEND | 14 tests, dont le rejet d'un token sans scope |
| 3 | Schémas Pydantic | BACKEND | 15 tests de validation |
| 4 | Tables et accès au catalogue | BACKEND | 43 tests cumulés |
| 5 | Construction des commandes | BACKEND | 50 tests cumulés |
| 6 | Routes et montage | BACKEND | 54 tests, dont le garde-fou anti-régression |
| 7 | Amorçage et vérification | BACKEND | `TOUT OK` et backend déployé |
| 8 | Client API et dérivations | FRONTEND | 13 tests verts |
| 9 | Boutique branchée sur l'API | FRONTEND | La boutique affiche les données de la base |
| 10 | Tunnel de commande | FRONTEND | Une commande apparaît en base |
| 11 | Route admin et connexion | FRONTEND | `/admin/123rvf` connecte et sépare le bundle |
| 12 | Panneau produits | FRONTEND | Créer un produit le fait apparaître sur le site |
| 13 | Panneau catégories | FRONTEND | Suppression d'une catégorie occupée refusée |
| 14 | Panneau commandes | FRONTEND | Les prix historiques ne bougent pas |
| 15 | Mise en production | les deux | Recette complète et isolation vérifiée |

## Ordre imposé

Les tâches 1 à 7 doivent être faites dans l'ordre : chacune dépend du code de la
précédente. La Task 7 doit être terminée et le backend déployé avant de commencer la Task 8,
sans quoi le frontend n'a aucune API à interroger.

Côté frontend, les tâches 12, 13 et 14 sont indépendantes entre elles une fois la Task 11
terminée : elles peuvent être traitées dans n'importe quel ordre.
