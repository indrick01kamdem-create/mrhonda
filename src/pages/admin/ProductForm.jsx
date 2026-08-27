import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ActionButton, Field, SelectInput, TextInput } from './ui';
import { ImageField } from './ImageField';

const EMPTY = {
  name: '',
  category_slug: '',
  price: '',
  old_price: '',
  badge: '',
  rating: 0,
  specs: [],
  image: '',
  visible: true,
  position: 0,
};

function toForm(product) {
  if (!product) return EMPTY;
  return {
    name: product.name,
    category_slug: product.category_slug,
    price: String(product.price),
    old_price: product.old_price === null ? '' : String(product.old_price),
    badge: product.badge ?? '',
    rating: product.rating,
    specs: product.specs ?? [],
    image: product.image ?? '',
    visible: product.visible,
    position: product.position,
  };
}

export function ProductForm({ product, categories, token, busy, errors, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(product));

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const setSpec = (index, text) =>
    setForm({ ...form, specs: form.specs.map((spec, i) => (i === index ? text : spec)) });

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      category_slug: form.category_slug,
      price: Number(form.price),
      old_price: form.old_price === '' ? null : Number(form.old_price),
      badge: form.badge.trim() || null,
      rating: Number(form.rating),
      specs: form.specs.map((spec) => spec.trim()).filter(Boolean),
      image: form.image.trim() || null,
      visible: form.visible,
      position: Number(form.position),
    });
  };

  return (
    <form onSubmit={submit} className="border-2 border-neutral-950 bg-white p-6">
      <h2 className="font-['Archivo'] text-2xl font-black uppercase">
        {product ? 'Modifier le produit' : 'Nouveau produit'}
      </h2>
      {product && (
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Identifiant : <code>{product.id}</code> — non modifiable, il sert aux liens partagés.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Nom" error={errors.name}>
          <TextInput value={form.name} onChange={set('name')} required maxLength={120} />
        </Field>

        <Field label="Catégorie" error={errors.category_slug}>
          <SelectInput value={form.category_slug} onChange={set('category_slug')} required>
            <option value="">Choisir…</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Prix (FCFA)" error={errors.price}>
          <TextInput type="number" min="0" step="1" value={form.price} onChange={set('price')} required />
        </Field>

        <Field label="Ancien prix (optionnel)" error={errors.old_price}>
          <TextInput type="number" min="0" step="1" value={form.old_price} onChange={set('old_price')} />
        </Field>

        <Field label="Badge (optionnel)" error={errors.badge}>
          <TextInput value={form.badge} onChange={set('badge')} maxLength={20} placeholder="PROMO" />
        </Field>

        <Field label="Note (0 à 5)" error={errors.rating}>
          <TextInput type="number" min="0" max="5" step="1" value={form.rating} onChange={set('rating')} />
        </Field>

        <Field
          label="Position d'affichage"
          error={errors.position}
          hint="0 en premier. Le produit en position 0 est mis en avant sur l'accueil."
        >
          <TextInput type="number" min="0" max="999" step="1" value={form.position} onChange={set('position')} />
        </Field>

        <label className="flex items-end gap-3 pb-2">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(event) => setForm({ ...form, visible: event.target.checked })}
            className="h-5 w-5"
          />
          <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em]">
            Visible sur le site
          </span>
        </label>
      </div>

      <div className="mt-5">
        <ImageField
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
          token={token}
          error={errors.image}
        />
      </div>

      <div className="mt-6">
        <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
          Points forts
        </span>
        {errors.specs && <p className="mt-1 text-sm font-semibold text-red-700">{errors.specs}</p>}
        <div className="mt-2 space-y-2">
          {form.specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={spec}
                maxLength={120}
                onChange={(event) => setSpec(index, event.target.value)}
                className="h-11 flex-1 border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Retirer"
                onClick={() => setForm({ ...form, specs: form.specs.filter((_, i) => i !== index) })}
                className="border-2 border-neutral-300 px-3 text-neutral-400 hover:border-red-700 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {form.specs.length < 12 && (
          <button
            type="button"
            onClick={() => setForm({ ...form, specs: [...form.specs, ''] })}
            className="mt-3 inline-flex items-center gap-2 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:text-red-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un point fort
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <ActionButton type="submit" busy={busy}>
          {product ? 'Enregistrer' : 'Créer'}
        </ActionButton>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 border-2 border-neutral-300 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] hover:border-neutral-950"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
