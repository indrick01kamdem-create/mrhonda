// Backend de production. Sert de repli quand VITE_API_BASE_URL n'est pas
// défini, pour qu'un déploiement ne dépende pas d'une variable oubliée.
// En développement, .env.local pointe vers le backend local et l'emporte.
const DEFAULT_BASE_URL = 'https://generalpolstermoebel-backend-production.up.railway.app';

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

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
  if (body !== undefined && !formData) headers['Content-Type'] = 'application/json';

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
