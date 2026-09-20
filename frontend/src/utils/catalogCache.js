// Cache local du catalogue : il sert à afficher la boutique instantanément au
// retour d'un visiteur, pendant qu'une requête silencieuse va chercher la
// version à jour. C'est un confort d'affichage, jamais une source de vérité :
// toute erreur de lecture ou d'écriture est absorbée sans conséquence.

const CACHE_KEY = 'mrhonda_catalog_v1';

export function readCatalogCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Un cache écrit par une version antérieure du site peut avoir une autre
    // forme : on le rejette plutôt que de faire planter la page.
    if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.products)) {
      return null;
    }
    if (parsed.categories.length === 0 && parsed.products.length === 0) {
      return null;
    }

    return {
      categories: parsed.categories,
      products: parsed.products,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0,
    };
  } catch {
    // Navigation privée, stockage bloqué, JSON corrompu : on repart à zéro.
    return null;
  }
}

export function writeCatalogCache({ categories, products }) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ categories, products, savedAt: Date.now() }),
    );
  } catch {
    // Quota dépassé ou stockage refusé : le site fonctionne sans cache.
  }
}

export function clearCatalogCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Rien à faire : il n'y avait déjà pas de cache accessible.
  }
}
