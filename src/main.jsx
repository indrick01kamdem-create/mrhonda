import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useCatalog } from './hooks/useCatalog';
import { CatalogSkeleton } from './components/shop/CatalogSkeleton';
import { ErrorState } from './components/shop/ErrorState';
import { ShopHeader } from './components/shop/ShopHeader';
import { ShopFooter } from './components/shop/ShopFooter';
import { ShopHomePage } from './pages/shop/ShopHomePage';
import { CategoryPage } from './pages/shop/CategoryPage';
import { ProductDetailPage } from './pages/shop/ProductDetailPage';
import { CartPage } from './pages/shop/CartPage';
import { FormationSite } from './pages/formation/FormationSite';
import './styles.css';

const AdminApp = lazy(() => import('./pages/admin/AdminApp').then((m) => ({ default: m.AdminApp })));

const ADMIN_PATH = '/admin/123rvf';

function parseRoute() {
  const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  if (path === ADMIN_PATH) {
    return { site: 'admin', tab: window.location.hash.replace(/^#/, '') || 'produits' };
  }

  const hash = window.location.hash.replace(/^#/, '');

  if (hash === 'formation') return { site: 'formation', page: 'home' };
  if (hash === 'inscription') return { site: 'formation', page: 'register' };
  if (hash === 'filieres' || hash === 'parcours' || hash === 'diagnostic') {
    return { site: 'formation', page: 'home', anchor: hash };
  }
  if (hash === 'panier') return { site: 'shop', page: 'cart' };
  if (hash === 'promos' || hash === 'categories') return { site: 'shop', page: 'home', anchor: hash };
  if (hash.startsWith('category/')) return { site: 'shop', page: 'category', slug: hash.split('/')[1] || 'all' };
  if (hash.startsWith('product/')) return { site: 'shop', page: 'product', id: hash.split('/')[1] };

  return { site: 'shop', page: 'home' };
}

function App() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  if (route.site === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center font-['Archivo'] font-black uppercase">
            Chargement du dashboard…
          </div>
        }
      >
        <AdminApp tab={route.tab} />
      </Suspense>
    );
  }

  if (route.site === 'formation') {
    return <FormationSite initialPage={route.page} anchor={route.anchor} />;
  }

  return <ShopApp route={route} />;
}

function ShopApp({ route }) {
  const { loading, error, categories, products, reload } = useCatalog();
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    if (!route.anchor) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.requestAnimationFrame(() => {
        document.getElementById(route.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [route]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)));
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const selectedProduct =
    route.page === 'product' ? products.find((product) => product.id === route.id) ?? null : null;

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-neutral-950">
      <ShopHeader
        cartCount={cartCount}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        categories={categories}
      />
      {error && route.page !== 'cart' ? (
        <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <ErrorState error={error} onRetry={reload} />
        </main>
      ) : (
        <>
          {route.page === 'home' &&
            (loading ? (
              <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <CatalogSkeleton />
              </main>
            ) : (
              <ShopHomePage onAdd={addToCart} products={products} categories={categories} />
            ))}
          {route.page === 'category' &&
            (loading ? (
              <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
                <CatalogSkeleton />
              </main>
            ) : (
              <CategoryPage slug={route.slug} onAdd={addToCart} products={products} categories={categories} />
            ))}
          {route.page === 'product' && (
            <ProductDetailPage product={selectedProduct} onAdd={addToCart} loading={loading} />
          )}
          {route.page === 'cart' && (
            <CartPage
              cart={cart}
              onAdd={(id) => updateQuantity(id, 1)}
              onSubtract={(id) => updateQuantity(id, -1)}
              onRemove={removeFromCart}
            />
          )}
        </>
      )}
      <ShopFooter />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
