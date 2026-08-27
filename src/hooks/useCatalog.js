import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCatalog } from '../api/catalog';

export function useCatalog() {
  const [state, setState] = useState({ loading: true, error: null, categories: [], products: [] });
  const latestRequest = useRef(0);

  const load = useCallback(() => {
    const requestId = ++latestRequest.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetchCatalog()
      .then((data) => {
        // Une réponse plus ancienne ne doit jamais écraser une plus récente.
        if (requestId !== latestRequest.current) return;
        setState({
          loading: false,
          error: null,
          categories: data?.categories ?? [],
          products: data?.products ?? [],
        });
      })
      .catch((error) => {
        if (requestId !== latestRequest.current) return;
        setState({ loading: false, error, categories: [], products: [] });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
