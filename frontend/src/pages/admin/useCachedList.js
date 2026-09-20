import { useCallback, useEffect, useRef, useState } from 'react';
import { readAdminCache, writeAdminCache } from './adminCache';

// Affiche le cache immédiatement s'il existe, puis rafraîchit en silence.
// `fetcher` doit être stable (useCallback), sinon le rechargement boucle.
export function useCachedList(cacheKey, fetcher) {
  const [state, setState] = useState(() => {
    const cached = readAdminCache(cacheKey);
    return cached
      ? { data: cached, loading: false, refreshing: true, error: '' }
      : { data: null, loading: true, refreshing: false, error: '' };
  });
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;

    setState((current) =>
      current.data
        ? { ...current, refreshing: true, error: '' }
        : { ...current, loading: true, refreshing: false, error: '' },
    );

    try {
      const data = await fetcher();
      // Une réponse plus ancienne ne doit jamais écraser une plus récente.
      if (requestId !== latestRequest.current) return;
      writeAdminCache(cacheKey, data);
      setState({ data, loading: false, refreshing: false, error: '' });
    } catch (failure) {
      if (requestId !== latestRequest.current) return;
      const message = failure.detail || 'Chargement impossible';
      setState((current) =>
        current.data
          ? // On garde la liste affichée : un échec de rafraîchissement ne doit
            // pas vider l'écran, mais l'administrateur doit être averti que ce
            // qu'il voit n'est peut-être plus à jour.
            { ...current, loading: false, refreshing: false, error: message }
          : { data: null, loading: false, refreshing: false, error: message },
      );
    }
  }, [cacheKey, fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
