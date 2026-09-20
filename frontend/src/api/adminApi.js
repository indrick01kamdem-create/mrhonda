import { apiFetch } from './client';

const BASE = '/api/mrhonda/admin';

export const listCategories = (token) => apiFetch(`${BASE}/categories`, { token });
export const createCategory = (token, body) => apiFetch(`${BASE}/categories`, { method: 'POST', token, body });
export const updateCategory = (token, slug, body) =>
  apiFetch(`${BASE}/categories/${encodeURIComponent(slug)}`, { method: 'PUT', token, body });
export const deleteCategory = (token, slug) =>
  apiFetch(`${BASE}/categories/${encodeURIComponent(slug)}`, { method: 'DELETE', token });

export const listProducts = (token) => apiFetch(`${BASE}/products`, { token });
export const createProduct = (token, body) => apiFetch(`${BASE}/products`, { method: 'POST', token, body });
export const updateProduct = (token, id, body) =>
  apiFetch(`${BASE}/products/${encodeURIComponent(id)}`, { method: 'PUT', token, body });
export const deleteProduct = (token, id) =>
  apiFetch(`${BASE}/products/${encodeURIComponent(id)}`, { method: 'DELETE', token });

export const listOrders = (token, status) =>
  apiFetch(`${BASE}/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token });
export const updateOrderStatus = (token, id, status) =>
  apiFetch(`${BASE}/orders/${id}/status`, { method: 'PATCH', token, body: { status } });

export const uploadImage = (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`${BASE}/media`, { method: 'POST', token, formData });
};
