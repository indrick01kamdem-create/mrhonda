import { apiFetch } from './client';

export function createOrder(payload) {
  return apiFetch('/api/mrhonda/orders', { method: 'POST', body: payload });
}
