import { useCallback, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../../api/adminApi';
import { fieldErrors } from '../../api/client';
import { formatPrice } from '../../utils/format';
import { ActionButton, Banner } from './ui';
import { ProductForm } from './ProductForm';
import { useCachedList } from './useCachedList';

export function ProductsPanel({ request, token }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchProducts = useCallback(() => request(listProducts), [request]);
  const fetchCategories = useCallback(() => request(listCategories), [request]);

  // Le cache « categories » est le même que celui de l'onglet Catégories :
  // une modification faite là-bas se retrouve ici sans recharger.
  const productsState = useCachedList('products', fetchProducts);
  const categoriesState = useCachedList('categories', fetchCategories);

  const products = productsState.data ?? [];
  const categories = categoriesState.data ?? [];
  const loading = productsState.loading || categoriesState.loading;
  const refreshing = productsState.refreshing || categoriesState.refreshing;
  const loadError = productsState.error || categoriesState.error;

  const reloadProducts = productsState.reload;
  const reloadCategories = categoriesState.reload;
  const reload = useCallback(
    () => Promise.all([reloadProducts(), reloadCategories()]),
    [reloadProducts, reloadCategories],
  );

  const save = async (payload) => {
    setBusy(true);
    setErrors({});
    setError('');
    try {
      if (editing === 'new') {
        await request((t) => createProduct(t, payload));
        setNotice('Produit créé.');
      } else {
        await request((t) => updateProduct(t, editing.id, payload));
        setNotice('Produit enregistré.');
      }
      setEditing(null);
      await reload();
    } catch (failure) {
      setErrors(fieldErrors(failure.body));
      setError(failure.detail || 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Supprimer définitivement « ${product.name} » ?`)) return;
    setError('');
    try {
      await request((t) => deleteProduct(t, product.id));
      setNotice('Produit supprimé.');
      await reload();
    } catch (failure) {
      setError(failure.detail || 'Suppression impossible');
    }
  };

  if (loading) return <p className="font-semibold text-neutral-500">Chargement…</p>;

  if (editing) {
    return (
      <>
        <Banner kind="error" message={error} onClose={() => setError('')} />
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          token={token}
          busy={busy}
          errors={errors}
          onSubmit={save}
          onCancel={() => {
            setEditing(null);
            setErrors({});
            setError('');
          }}
        />
      </>
    );
  }

  return (
    <>
      <Banner kind="error" message={error || loadError} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      {categories.length === 0 ? (
        <div className="border-2 border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-neutral-600">
            Créez d'abord une catégorie : un produit doit appartenir à une catégorie existante.
          </p>
          <a
            href="#categories"
            className="mt-5 inline-flex h-11 items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] text-white hover:border-red-700 hover:bg-red-700"
          >
            Aller aux catégories
          </a>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-semibold text-neutral-500">
              {products.length} produit{products.length > 1 ? 's' : ''}
              {refreshing && <span className="ml-2 text-xs font-black uppercase tracking-[.1em] text-neutral-400">mise à jour…</span>}
            </p>
            <ActionButton onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              Nouveau produit
            </ActionButton>
          </div>

          {products.length === 0 ? (
            <p className="border-2 border-neutral-300 bg-white p-8 text-center font-semibold text-neutral-500">
              Aucun produit. Cliquez sur « Nouveau produit ».
            </p>
          ) : (
            <>
              {/* Mobile et tablette : une grille de cartes, lisible sans défilement latéral. */}
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                {products.map((product) => (
                  <article key={product.id} className="flex gap-4 border-2 border-neutral-950 bg-white p-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="h-20 w-20 shrink-0 border border-neutral-200 object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 shrink-0 bg-neutral-100" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="font-['Archivo'] text-[11px] font-black uppercase tracking-[.12em] text-neutral-500">
                        {product.category_title}
                      </p>
                      <h3 className="mt-1 font-['Archivo'] text-base font-black uppercase leading-5 break-words">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <strong className="font-['Archivo'] text-lg text-red-700">
                          {formatPrice(product.price)}
                        </strong>
                        <span
                          className={`text-[11px] font-black uppercase tracking-[.1em] ${
                            product.visible ? 'text-emerald-700' : 'text-neutral-400'
                          }`}
                        >
                          {product.visible ? 'Visible' : 'Masqué'}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-4">
                        <button
                          onClick={() => setEditing(product)}
                          className="inline-flex items-center gap-1.5 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:text-red-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => remove(product)}
                          className="inline-flex items-center gap-1.5 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] text-neutral-400 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Grand écran : le tableau, plus dense. */}
              <div className="hidden border-2 border-neutral-950 bg-white lg:block">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-neutral-950">
                    <tr className="font-['Archivo'] text-xs font-black uppercase tracking-[.1em]">
                      <th className="p-3">Image</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3">Prix</th>
                      <th className="p-3">Visible</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-neutral-200 last:border-0">
                        <td className="p-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="h-12 w-12 border border-neutral-200 object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-neutral-100" />
                          )}
                        </td>
                        <td className="p-3 font-semibold">{product.name}</td>
                        <td className="p-3 text-neutral-600">{product.category_title}</td>
                        <td className="p-3 font-bold">{formatPrice(product.price)}</td>
                        <td className="p-3">
                          <span className={product.visible ? 'text-emerald-700' : 'text-neutral-400'}>
                            {product.visible ? 'Oui' : 'Masqué'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditing(product)}
                              aria-label={`Modifier ${product.name}`}
                              className="hover:text-red-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => remove(product)}
                              aria-label={`Supprimer ${product.name}`}
                              className="text-neutral-400 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
