import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../../api/adminApi';
import { fieldErrors } from '../../api/client';
import { formatPrice } from '../../utils/format';
import { ActionButton, Banner } from './ui';
import { ProductForm } from './ProductForm';

export function ProductsPanel({ request, token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        request(listProducts),
        request(listCategories),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (failure) {
      setError(failure.detail || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

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
      await load();
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
      await load();
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
      <Banner kind="error" message={error} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      {categories.length === 0 ? (
        <div className="border-2 border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-neutral-600">
            Créez d'abord une catégorie : un produit doit appartenir à une catégorie existante.
          </p>
          <a href="#categories" className="btn-skew p mt-5 inline-flex">
            <span>Aller aux catégories</span>
          </a>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-semibold text-neutral-500">
              {products.length} produit{products.length > 1 ? 's' : ''}
            </p>
            <ActionButton onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              Nouveau produit
            </ActionButton>
          </div>

          <div className="overflow-x-auto border-2 border-neutral-950 bg-white">
            <table className="w-full min-w-[720px] text-left">
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
                        <img src={product.image} alt="" className="h-12 w-12 border border-neutral-200 object-cover" />
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
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center font-semibold text-neutral-500">
                      Aucun produit. Cliquez sur « Nouveau produit ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
