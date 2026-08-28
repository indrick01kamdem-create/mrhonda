import { useCallback, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../../api/adminApi';
import { fieldErrors } from '../../api/client';
import { ActionButton, Banner } from './ui';
import { CategoryForm } from './CategoryForm';
import { useCachedList } from './useCachedList';

export function CategoriesPanel({ request, token }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchCategories = useCallback(() => request(listCategories), [request]);
  const { data, loading, refreshing, error: loadError, reload } = useCachedList(
    'categories',
    fetchCategories,
  );
  const categories = data ?? [];

  const save = async (payload) => {
    setBusy(true);
    setErrors({});
    setError('');
    try {
      if (editing === 'new') {
        await request((t) => createCategory(t, payload));
        setNotice('Catégorie créée.');
      } else {
        await request((t) => updateCategory(t, editing.slug, payload));
        setNotice('Catégorie enregistrée.');
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

  const remove = async (category) => {
    if (!window.confirm(`Supprimer la catégorie « ${category.title} » ?`)) return;
    setError('');
    try {
      await request((t) => deleteCategory(t, category.slug));
      setNotice('Catégorie supprimée.');
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
        <CategoryForm
          category={editing === 'new' ? null : editing}
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

      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="font-semibold text-neutral-500">
          {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          {refreshing && <span className="ml-2 text-xs font-black uppercase tracking-[.1em] text-neutral-400">mise à jour…</span>}
        </p>
        <ActionButton onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </ActionButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article key={category.slug} className="border-2 border-neutral-950 bg-white">
            {category.image ? (
              <img src={category.image} alt="" className="h-32 w-full object-cover" />
            ) : (
              <div className="h-32 w-full bg-neutral-100" />
            )}
            <div className="p-4">
              <h3 className="font-['Archivo'] text-lg font-black uppercase">{category.title}</h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Position {category.position} · {category.product_count} produit
                {category.product_count > 1 ? 's' : ''}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{category.text}</p>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => setEditing(category)}
                  className="inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:text-red-700"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => remove(category)}
                  className="inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] text-neutral-400 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
        {categories.length === 0 && (
          <p className="col-span-full border-2 border-neutral-300 bg-white p-8 text-center font-semibold text-neutral-500">
            Aucune catégorie. Créez-en une pour pouvoir ajouter des produits.
          </p>
        )}
      </div>
    </>
  );
}
