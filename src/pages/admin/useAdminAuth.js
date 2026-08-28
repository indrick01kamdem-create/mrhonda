import { useCallback, useState } from 'react';
import { apiFetch } from '../../api/client';
import { clearAdminCache } from './adminCache';

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
    clearAdminCache();
    write(TOKEN_KEY, data.token);
    write(EMAIL_KEY, data.email);
    setToken(data.token);
    setEmail(data.email);
  }, []);

  const logout = useCallback(() => {
    // Les listes en cache contiennent des données personnelles de clients :
    // elles disparaissent avec la session, comme le jeton.
    clearAdminCache();
    write(TOKEN_KEY, null);
    write(EMAIL_KEY, null);
    setToken(null);
    setEmail(null);
  }, []);

  return { token, email, login, logout };
}
