// Cache des listes du dashboard : il évite de revoir un écran de chargement à
// chaque changement d'onglet. Volontairement en sessionStorage et non en
// localStorage : les commandes contiennent des données personnelles de clients
// (nom, téléphone, ville) qui ne doivent pas survivre à la session, exactement
// comme le jeton d'authentification.

const PREFIX = 'mrhonda_admin_cache_v1:';

export function readAdminCache(key) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Un cache écrit par une version antérieure peut avoir une autre forme.
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeAdminCache(key, value) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota dépassé ou stockage refusé : le dashboard fonctionne sans cache.
  }
}

export function clearAdminCache() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Rien à purger si le stockage est inaccessible.
  }
}
