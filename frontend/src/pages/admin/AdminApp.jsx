import { useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { useAdminAuth } from './useAdminAuth';
import { ProductsPanel } from './ProductsPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { OrdersPanel } from './OrdersPanel';

export function AdminApp({ tab }) {
  const { token, email, login, logout } = useAdminAuth();

  const request = useCallback(
    async (call) => {
      try {
        return await call(token);
      } catch (error) {
        if (error.status === 401) logout();
        throw error;
      }
    },
    [token, logout],
  );

  if (!token) return <AdminLogin onLogin={login} />;

  return (
    <AdminLayout tab={tab} email={email} onLogout={logout}>
      {tab === 'produits' && <ProductsPanel request={request} token={token} />}
      {tab === 'categories' && <CategoriesPanel request={request} token={token} />}
      {tab === 'commandes' && <OrdersPanel request={request} />}
    </AdminLayout>
  );
}
