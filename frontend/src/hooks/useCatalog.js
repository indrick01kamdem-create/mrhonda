import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCatalog } from '../api/catalog';
import { readCatalogCache, writeCatalogCache } from '../utils/catalogCache';

function initialState() {
  const cached = readCatalogCache();
  if (cached) {
    // Cache d'abord : on affiche tout de suite, la mise à jour suivra.
    return {
      loading: false,
      refreshing: true,
      error: null,
      fromCache: true,
      categories: cached.categories,
      products: cached.products,
    };
  }
  return {
    loading: true,
    refreshing: false,
    error: null,
    fromCache: false,
    categories: [],
    products: [],
  };
}

function hasSomethingOnScreen(state) {
  return state.fromCache || state.categories.length > 0 || state.products.length > 0;
}

export function useCatalog() {
  const [state, setState] = useState(initialState);
  const latestRequest = useRef(0);

  const load = useCallback(() => {
    const requestId = ++latestRequest.current;

    setState((current) =>
      hasSomethingOnScreen(current)
        ? // Quelque chose est déjà affiché : le rafraîchissement reste discret,
          // sans squelette ni écran d'erreur qui remplacerait le contenu.
          { ...current, refreshing: true, error: null }
        : { ...current, loading: true, refreshing: false, error: null },
    );

    fetchCatalog()
      .then((data) => {
        // Une réponse plus ancienne ne doit jamais écraser une plus récente.
        if (requestId !== latestRequest.current) return;

        const categories = data?.categories ?? [];
        const products = data?.products ?? [];
        writeCatalogCache({ categories, products });

        setState({
          loading: false,
          refreshing: false,
          error: null,
          fromCache: false,
          categories,
          products,
        });
      })
      .catch((error) => {
        if (requestId !== latestRequest.current) return;

        setState((current) =>
          hasSomethingOnScreen(current)
            ? // Un échec de rafraîchissement ne doit pas effacer un catalogue
              // déjà à l'écran : le visiteur garde une boutique utilisable.
              { ...current, loading: false, refreshing: false, error: null }
            : {
                loading: false,
                refreshing: false,
                error,
                fromCache: false,
                categories: [],
                products: [],
              },
        );
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
