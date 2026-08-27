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
