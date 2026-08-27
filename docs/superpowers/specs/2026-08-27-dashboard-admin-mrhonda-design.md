# Dashboard admin mrhonda — design

Date : 2026-08-27
Statut : validé, prêt pour la planification d'implémentation

## 1. Objectif

Donner à mrhonda un dashboard d'administration permettant de gérer le catalogue de la
boutique (produits, catégories, images) et de consulter les commandes, sans redéployer le
site à chaque changement de prix ou d'article.

Aujourd'hui le catalogue est codé en dur dans `src/data/shop.js` : toute modification exige
une édition de code, un commit et un déploiement.

## 2. Périmètre

Inclus :

- CRUD produits
- CRUD catégories, en nombre illimité (pas les 3 catégories actuellement figées)
- Upload d'images vers Cloudinary depuis le dashboard
- Enregistrement et suivi des commandes passées via le panier
- Authentification admin isolée de celle de generalpolstermoebel

Exclu de cette version :

- Gestion des stocks et des quantités disponibles
- Paiement en ligne (la commande se conclut toujours sur WhatsApp)
- Comptes clients
- Administration du site formation (`FormationSite`), qui reste statique
- Rôles ou permissions multiples : tous les admins mrhonda ont les mêmes droits

## 3. Contexte technique

**Frontend mrhonda** — React 19, Vite 6, Tailwind 4, `lucide-react`. Pas de react-router :
le routage se fait par hash dans `parseRoute()` (`src/main.jsx`). Deux sites cohabitent dans
le même bundle, `shop` et `formation`. Déployé sur Railway via Docker (`npm start` =
`vite build && vite preview`).

**Backend** — FastAPI, déployé sur Railway à
`https://generalpolstermoebel-backend-production.up.railway.app/`, base Postgres (Neon) via
SQLAlchemy en SQL brut (`text()`), images sur Cloudinary. Il sert déjà le dashboard
generalpolstermoebel monté sur `/dr_h123`, avec une table `admin_users` et un token HMAC
signé transmis en `Bearer`.

Contrainte directrice : **le site generalpolstermoebel tourne en production et ne doit subir
aucune régression.** Le code mrhonda s'ajoute, il ne modifie pas l'existant.

## 4. Décisions

| Sujet | Décision | Raison |
|---|---|---|
| Isolation admin | Table `mrhonda_admin_users` dédiée + routes `/api/mrhonda/*` | Un compte mrhonda ne doit jamais pouvoir éditer generalpolstermoebel, ni l'inverse |
| Stockage | Tables relationnelles dédiées, préfixées `mrhonda_` | Les commandes arrivent en concurrence depuis le public ; un blob JSONB réécrit en entier perdrait des données |
| Source de vérité | La base seule ; `shop.js` ne sert qu'à seeder une fois | Ce que montre le dashboard est exactement ce que voit le client |
| Chargement public | Fetch API avec skeletons, pas de repli sur les données en dur | Un repli silencieux afficherait des prix périmés sans que personne ne s'en aperçoive |
| Commandes | Mini-formulaire (nom, téléphone) avant l'ouverture de WhatsApp | Sans coordonnées, la liste des commandes serait inexploitable |
| Lignes de commande | Snapshot `jsonb` figé, pas de table `order_items` | Une commande est un document historique : changer un prix demain ne doit pas réécrire les commandes d'hier |
| Libellé de catégorie | Stocké une seule fois sur la catégorie, joint aux produits | Renommer une catégorie met à jour tous ses produits d'un coup |
| Suppression de catégorie | `ON DELETE RESTRICT` | Mieux vaut un refus explicite que des produits disparus en silence |
| Slugs | Générés à la création, immuables ensuite | Modifier un slug casserait les liens `#product/xxx` déjà partagés |
| Code du dashboard | `React.lazy` | Un visiteur de la boutique ne télécharge pas le code admin |

## 5. Architecture

### Backend

Nouveau module isolé :

```
app/mrhonda/__init__.py
app/mrhonda/models.py     Schémas Pydantic (payloads et réponses)
app/mrhonda/storage.py    SQL : création des tables et accès aux données
app/mrhonda/auth.py       Hash de mot de passe, token scopé, require_mrhonda_admin, anti-force brute
app/mrhonda/routes.py     APIRouter avec toutes les routes /api/mrhonda/*
```

`app/main.py` n'est modifié que par trois lignes : l'import du routeur, son
`include_router`, et l'appel à `mrhonda.storage.init_db()` dans le `startup` existant.

Chaque module a une responsabilité unique : `storage.py` ne connaît que le SQL et ne lève
pas de `HTTPException` ; `routes.py` ne contient pas de SQL ; `auth.py` ignore tout du
catalogue. Un module se comprend sans lire les autres.

### Frontend

```
src/api/client.js          Wrapper fetch : base URL, en-tête Bearer, erreurs normalisées
src/api/catalog.js         GET /catalog
src/api/orders.js          POST /orders
src/api/adminApi.js        Toutes les routes admin
src/hooks/useCatalog.js    { loading, error, categories, products, reload }

src/components/shop/CatalogSkeleton.jsx   Placeholders de chargement
src/components/shop/ErrorState.jsx        Message d'erreur + bouton Réessayer
src/components/shop/CheckoutDialog.jsx    Formulaire client avant WhatsApp

src/pages/admin/AdminApp.jsx        Racine lazy-loadée, aiguille login ou layout
src/pages/admin/useAdminAuth.js     Token en sessionStorage, login, logout, purge sur 401
src/pages/admin/AdminLogin.jsx
src/pages/admin/AdminLayout.jsx     En-tête, onglets, déconnexion
src/pages/admin/ProductsPanel.jsx
src/pages/admin/ProductForm.jsx
src/pages/admin/CategoriesPanel.jsx
src/pages/admin/CategoryForm.jsx
src/pages/admin/OrdersPanel.jsx
src/pages/admin/ImageField.jsx      Upload Cloudinary ou saisie d'URL
```

### Routage

`parseRoute()` lit `window.location.pathname` avant le hash :

- `pathname === '/admin/123rvf'` → `{ site: 'admin', tab }` où `tab` vient du hash
  (`#produits`, `#categories`, `#commandes`, défaut `produits`)
- sinon, comportement actuel inchangé

`vite preview` applique déjà le fallback SPA, donc `/admin/123rvf` renvoie `index.html` en
développement comme en production Docker. Aucune dépendance de routage à ajouter.

Le site `admin` est rendu via `React.lazy` + `Suspense`, ce qui le sort du bundle principal.

## 6. Modèle de données

Toutes les tables sont créées par `CREATE TABLE IF NOT EXISTS` au démarrage, comme le fait
déjà `app/storage.py`.

```sql
CREATE TABLE IF NOT EXISTS mrhonda_admin_users (
  email         text PRIMARY KEY,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mrhonda_categories (
  slug       text PRIMARY KEY,
  title      text NOT NULL,
  text       text NOT NULL DEFAULT '',
  image      text,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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
);

CREATE INDEX IF NOT EXISTS mrhonda_products_category_idx
  ON mrhonda_products (category_slug);

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
);

CREATE INDEX IF NOT EXISTS mrhonda_orders_created_idx
  ON mrhonda_orders (created_at DESC);

CREATE TABLE IF NOT EXISTS mrhonda_media_assets (
  public_id     text PRIMARY KEY,
  url           text NOT NULL,
  resource_type text NOT NULL,
  format        text,
  width         integer,
  height        integer,
  bytes         bigint,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

`mrhonda_media_assets` est distincte de la table `media_assets` existante : sans cela, la
galerie d'images de generalpolstermoebel se remplirait de pièces automobiles.

Le champ `category` (libellé lisible) présent dans `shop.js` n'est pas stocké sur le
produit : il est joint depuis `mrhonda_categories.title` à la lecture.

Format d'une ligne de `items` :

```json
{ "id": "kit-pieces-auto", "name": "Pack Pièces Auto Essentielles", "price": 85000, "quantity": 2 }
```

Les prix sont des entiers en FCFA, sans décimales.

## 7. API

Base : `https://generalpolstermoebel-backend-production.up.railway.app`

### Routes publiques

**`GET /api/mrhonda/catalog`**

Renvoie catégories et produits en une seule requête, ce qui évite deux allers-retours au
chargement de la boutique. Seuls les produits `visible = true` sont inclus, triés par
`position` puis `created_at`. Un en-tête `ETag` est renvoyé et un `If-None-Match`
correspondant donne un `304`, comme le fait déjà `/api/content`.

```json
{
  "categories": [
    { "slug": "pieces-moteur", "title": "Pièces moteur", "text": "...", "image": "https://...", "position": 0 }
  ],
  "products": [
    {
      "id": "kit-pieces-auto",
      "name": "Pack Pièces Auto Essentielles",
      "category": "Pièces moteur",
      "categorySlug": "pieces-moteur",
      "price": 85000,
      "oldPrice": 105000,
      "badge": "MOCK",
      "rating": 4,
      "specs": ["...", "..."],
      "image": "https://..."
    }
  ]
}
```

Les clés sont en `camelCase` pour que les composants existants (`ProductCard`,
`CategoryCard`, `CategoryPage`) fonctionnent sans réécriture de leurs accès aux champs.

**Convention de casse, à appliquer sans exception :** les réponses publiques
(`GET /catalog`) sont en `camelCase`, car elles alimentent directement des composants React
déjà écrits. Tout le reste — payloads admin, réponses admin, payload de commande — est en
`snake_case`, aligné sur les colonnes SQL et sur le style du backend existant. La
conversion se fait dans `storage.py` au moment de construire la réponse du catalogue, et
nulle part ailleurs.

**`POST /api/mrhonda/orders`**

```json
{
  "customer_name": "Jean Ndongo",
  "customer_phone": "+237690000000",
  "customer_city": "Yaoundé",
  "note": "Livraison Mvog-Ada",
  "items": [{ "id": "kit-pieces-auto", "quantity": 2 }]
}
```

**Le client n'envoie que des identifiants et des quantités.** Le serveur relit les noms et
les prix depuis la base, construit le snapshot `items` et calcule `total` lui-même : un prix
transmis par le navigateur ne serait pas digne de confiance. Un `id` inconnu ou masqué
renvoie un `400`. Les quantités sont bornées entre 1 et 99, le panier à 50 lignes.

Réponse : `{ "reference": "MRH-4F2A9C", "total": 170000 }`.

La référence est `MRH-` suivi de 6 caractères hexadécimaux tirés de `secrets`, régénérés en
cas de collision sur la contrainte `UNIQUE`.

### Routes admin

Toutes exigent `Authorization: Bearer <token>` avec un token de scope `mrhonda`.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/mrhonda/auth/login` | `{email, password}` → `{token, email}` |
| GET | `/api/mrhonda/admin/categories` | Toutes les catégories |
| POST | `/api/mrhonda/admin/categories` | Création, slug dérivé du titre |
| PUT | `/api/mrhonda/admin/categories/{slug}` | Modification (le slug ne change pas) |
| DELETE | `/api/mrhonda/admin/categories/{slug}` | Refusé si des produits l'utilisent |
| GET | `/api/mrhonda/admin/products` | Tous, y compris les masqués |
| POST | `/api/mrhonda/admin/products` | Création, id dérivé du nom |
| PUT | `/api/mrhonda/admin/products/{id}` | Modification (l'id ne change pas) |
| DELETE | `/api/mrhonda/admin/products/{id}` | Suppression |
| POST | `/api/mrhonda/admin/media` | Upload Cloudinary, dossier `mrhonda` |
| GET | `/api/mrhonda/admin/orders` | Antéchronologique, filtre `?status=` optionnel |
| PATCH | `/api/mrhonda/admin/orders/{id}/status` | `{"status": "traitee"}` |

Payload produit (création et modification) :

```json
{
  "name": "Pack Pièces Auto",
  "category_slug": "pieces-moteur",
  "price": 85000,
  "old_price": 105000,
  "badge": "PROMO",
  "rating": 4,
  "specs": ["Sélection", "Garantie"],
  "image": "https://res.cloudinary.com/...",
  "visible": true,
  "position": 0
}
```

`old_price`, `badge` et `image` acceptent `null`. `specs` est une liste de chaînes, chacune
plafonnée à 120 caractères, 12 entrées au maximum.

Payload catégorie : `{ "title", "text", "image", "position" }`.

Suppression d'une catégorie occupée : `409` avec
`{"detail": "4 produits utilisent cette catégorie"}`.

### Slugification

Minuscules, accents retirés par normalisation NFKD, tout caractère non alphanumérique
remplacé par un tiret, tirets multiples réduits, tirets de bord supprimés, longueur
plafonnée à 60. En cas de collision, on suffixe `-2`, `-3`, etc. Un nom entièrement
non alphanumérique retombe sur `produit` ou `categorie` suivi du suffixe numérique.

## 8. Authentification et sécurité

**Hachage** — même schéma que l'existant : PBKDF2-HMAC-SHA256 salé, via les fonctions
déjà éprouvées de `app/main.py`, réimplémentées dans `app/mrhonda/auth.py` pour ne pas
créer de dépendance croisée entre les deux modules.

**Token** — même format HMAC signé, avec un payload enrichi :

```json
{ "email": "admin@mrhonda.com", "scope": "mrhonda", "exp": 1756300000 }
```

Durée de vie : 12 heures, comme l'existant.

L'isolation tient dans les deux sens sans toucher au code generalpolstermoebel :

- Un token generalpolstermoebel présenté sur une route mrhonda n'a pas de `scope` :
  `require_mrhonda_admin` le rejette.
- Un token mrhonda présenté sur une route generalpolstermoebel passerait la signature
  seulement si les secrets étaient identiques, mais `require_admin` cherche ensuite l'email
  dans `admin_users`, où `admin@mrhonda.com` n'existe pas : rejet.

Le secret vient de `MRHONDA_TOKEN_SECRET`, avec repli sur `ADMIN_TOKEN_SECRET` si la
variable n'est pas définie, pour qu'un déploiement sans configuration supplémentaire
fonctionne. Définir un secret distinct rend les signatures elles-mêmes non
interchangeables ; c'est recommandé.

**Anti-force brute** — compteur en mémoire par email : après 5 échecs en 15 minutes, le
login renvoie `429` jusqu'à expiration de la fenêtre. Limite assumée : ce compteur est
remis à zéro à chaque redémarrage du service et n'est pas partagé entre instances. C'est
une gêne pour un script d'attaque, pas une protection absolue.

**Ce que `/admin/123rvf` protège** — rien. C'est une adresse discrète qui évite qu'un
visiteur tombe dessus par hasard, pas une barrière : l'URL apparaîtra dans l'historique du
navigateur et dans le `Referer`. La seule vraie protection est le mot de passe.

Le mot de passe initial retenu suit un motif très répandu (nom du site, `@`, `123`)
et tombe rapidement face à une attaque par dictionnaire ciblée. Il est implémenté tel que
demandé ; il est recommandé de le changer après la mise en route. Un changement de mot de
passe depuis le dashboard n'est pas dans le périmètre de cette version : il se fait en
relançant le script de seed.

## 9. Dashboard

### Connexion

`/admin/123rvf` affiche un formulaire email / mot de passe. En cas de succès, le token va en
`sessionStorage` — il disparaît à la fermeture de l'onglet, ce qui limite l'exposition sur
un poste partagé. Tout `401` sur une requête admin purge le token et ramène à cet écran.

### Onglet Produits

Tableau : miniature, nom, catégorie, prix, état de visibilité, actions (modifier,
supprimer). Un bouton « Nouveau produit » ouvre le formulaire.

Formulaire : nom, catégorie (select alimenté par la base), prix, ancien prix, badge, note de
0 à 5, specs éditables ligne par ligne (ajout et retrait), image, interrupteur « visible »,
position. L'identifiant est généré depuis le nom à la création et affiché en lecture seule
ensuite.

Un produit masqué (`visible = false`) reste dans le dashboard mais disparaît du site public.

### Onglet Catégories

Liste avec image, titre, position et nombre de produits rattachés. Formulaire : titre,
texte, image, position. La suppression d'une catégorie occupée affiche le décompte renvoyé
par le `409`.

Un garde-fou nécessaire : le formulaire produit exige au moins une catégorie existante. Si
la base n'en contient aucune, l'onglet Produits invite d'abord à en créer une.

### Onglet Commandes

Liste antéchronologique : référence, date, nom, téléphone, total, statut. Le statut se change
par un select (nouvelle / traitée / annulée). Les articles de la commande se déplient sous la
ligne. Un filtre par statut est disponible.

### Champ image

Deux modes dans un même composant : téléverser un fichier vers
`POST /api/mrhonda/admin/media`, ou coller une URL. Un aperçu s'affiche dans les deux cas.
Contraintes vérifiées côté client avant l'envoi : type image et taille maximale de 5 Mo,
avec un message explicite en cas de dépassement.

## 10. Impact sur le site public

`src/data/shop.js` ne conserve que `WA_NUMBER`. Les exports `products`, `categories`,
`filters` et `productImages` disparaissent.

Les composants qui les importaient reçoivent désormais leurs données en props depuis `App` :

- `src/main.jsx` — appelle `useCatalog()`, passe `products` et `categories` aux pages, et
  initialise le panier **vide** (il démarre aujourd'hui avec `products[0]` déjà dedans, ce
  qui n'a plus de sens sans catalogue statique).
- `src/pages/shop/ShopHomePage.jsx` — le produit vedette du héros reste « le premier
  produit », désormais entendu comme le premier par `position` : l'admin choisit donc la
  vedette en jouant sur ce champ.
- `src/pages/shop/CategoryPage.jsx` — `filters` devient dérivé :
  `['Tout', ...categories.map(c => c.title)]`. Cela corrige au passage l'incohérence
  actuelle, où `filters` annonce 6 catégories alors que 3 existent.
- `src/pages/shop/ProductDetailPage.jsx` — gère déjà deux états, produit trouvé et
  « Produit introuvable ». Il lui manque le troisième : **catalogue en cours de
  chargement**. Sans lui, le visiteur qui ouvre un lien direct vers une fiche produit voit
  « Ce produit n'existe pas » pendant le fetch, avant que la page ne se corrige toute
  seule. Une prop `loading` suffit, à tester avant le `if (!product)` existant.

`ShopHeader`, `ShopFooter` et `FormationSite` n'importent que `WA_NUMBER` : ils ne changent
pas.

### Tunnel de commande

Le bouton « Commander » de `CartPage` ouvre `CheckoutDialog` : nom (requis), téléphone
(requis), ville (optionnelle), note (optionnelle). À la validation, `POST /orders` est
appelé, puis WhatsApp s'ouvre avec le récapitulatif **et la référence de commande**, ce qui
permet de rapprocher une conversation d'une ligne du dashboard.

Si l'enregistrement échoue, un message propose deux issues : réessayer, ou continuer sur
WhatsApp sans enregistrement. Perdre une vente parce que la base est injoignable serait pire
que perdre une ligne de suivi.

## 11. États de chargement et erreurs

**Boutique** — `CatalogSkeleton` pendant le fetch initial. En cas d'échec, `ErrorState`
affiche un message lisible et un bouton « Réessayer » : jamais une boutique vide sans
explication. Un catalogue vide mais valide affiche « Aucun produit pour le moment ».

**Dashboard** — les erreurs de validation FastAPI (`422`) sont rattachées au champ concerné.
Les autres erreurs s'affichent en bandeau. Une confirmation apparaît après chaque
sauvegarde réussie. Les suppressions demandent confirmation.

**Normalisation** — `src/api/client.js` transforme toute réponse non-OK en une erreur
portant `status` et `detail`, pour que les composants n'aient jamais à interpréter une
réponse brute.

## 12. Migration et amorçage

Script `scripts/seed_mrhonda.py`, à lancer une fois localement contre la base de production :

1. Crée les tables si nécessaire.
2. Crée l'admin `admin@mrhonda.com` avec le mot de passe fourni en argument ou par la
   variable `MRHONDA_ADMIN_PASSWORD`. **Le mot de passe n'est pas écrit dans le code du
   dépôt.** Si l'admin existe déjà, le script met son mot de passe à jour, ce qui en fait
   aussi l'outil de réinitialisation.
3. Importe les catégories et les produits actuels de `shop.js`, transcrits dans le script
   sous forme de littéraux Python. `INSERT ... ON CONFLICT DO NOTHING` : relancer le script
   ne duplique rien et n'écrase pas les modifications faites depuis le dashboard.

   **Six catégories sont créées, pas trois.** `shop.js` en déclare 3, mais ses produits en
   référencent 6 : `freinage`, `climatisation` et `entretien` n'ont pas de carte sur
   l'accueil alors que leurs pages de filtre fonctionnent déjà via la constante `filters`.
   La clé étrangère de `mrhonda_products` rendrait un import à 3 catégories impossible.
   Conséquence visible : la section « Catégories populaires » affichera 6 cartes au lieu de
   3. L'administrateur peut en supprimer ou les réordonner depuis le dashboard.

## 13. Tests

`pytest` est ajouté à `requirements.txt` — le projet n'en avait aucun.

`tests/test_mrhonda_unit.py` couvre ce qui est testable sans infrastructure :

- slugification : accents, ponctuation, chaîne vide, collisions, troncature
- hachage : un mot de passe vérifie contre son propre hash et pas contre un autre
- token : un token valide se décode, un token expiré est rejeté, un token sans `scope` est
  rejeté, une signature altérée est rejetée
- calcul du total à partir de prix serveur, et rejet d'un produit inconnu ou masqué
- validation Pydantic : prix négatif, note hors bornes, quantité nulle, specs trop longues

Le CRUD dépend de constructions propres à Postgres (`jsonb`, `bigserial`, `REFERENCES`) et
n'est pas couvert par des tests automatisés : monter une base de test dépasse le cadre de
cette version. À la place, `scripts/verify_mrhonda.py` exécute contre la base de
développement une séquence de bout en bout — créer une catégorie, créer un produit, tenter
de supprimer la catégorie occupée et vérifier le `409`, passer une commande, changer son
statut, nettoyer — et affiche un résultat par étape.

## 14. Déploiement

Le backend et le frontend sont deux dépôts GitHub distincts déployés sur Railway.

Actions manuelles requises, hors du code :

1. Ajouter l'URL de production du frontend mrhonda à `CORS_ORIGINS` dans les variables
   Railway du backend. Sans cela, le navigateur bloquera tous les appels.
2. Définir `MRHONDA_TOKEN_SECRET` dans les variables Railway du backend (recommandé, non
   bloquant).
3. Définir `VITE_API_BASE_URL` dans les variables Railway du frontend, pointant sur le
   backend. En développement, `.env.local` avec la même variable.
4. Lancer `scripts/seed_mrhonda.py` une fois, après le déploiement du backend.

L'ordre importe : déployer le backend, amorcer la base, puis déployer le frontend.
