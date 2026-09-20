import { apiFetch } from './client';

export function fetchCatalog() {
  return apiFetch('/api/mrhonda/catalog');
}
