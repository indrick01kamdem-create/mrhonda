import { useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { useAdminAuth } from './useAdminAuth';

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
      {tab === 'produits' && <p className="font-semibold text-neutral-500">Panneau produits — Task 12</p>}
      {tab === 'categories' && <p className="font-semibold text-neutral-500">Panneau catégories — Task 13</p>}
      {tab === 'commandes' && <p className="font-semibold text-neutral-500">Panneau commandes — Task 14</p>}
    </AdminLayout>
  );
}
