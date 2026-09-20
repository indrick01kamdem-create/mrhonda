import { useState } from 'react';
import { ActionButton, Field, TextInput } from './ui';
import { ImageField } from './ImageField';

const EMPTY = { title: '', text: '', image: '', position: 0 };

export function CategoryForm({ category, token, busy, errors, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    category
      ? {
          title: category.title,
          text: category.text ?? '',
          image: category.image ?? '',
          position: category.position,
        }
      : EMPTY,
  );

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title.trim(),
      text: form.text.trim(),
      image: form.image.trim() || null,
      position: Number(form.position),
    });
  };

  return (
    <form onSubmit={submit} className="border-2 border-neutral-950 bg-white p-4 sm:p-6">
      <h2 className="font-['Archivo'] text-2xl font-black uppercase">
        {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      </h2>
      {category && (
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Slug : <code className="break-all">{category.slug}</code> — non modifiable, il sert aux liens partagés.
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Titre" error={errors.title}>
          <TextInput value={form.title} onChange={set('title')} required maxLength={80} />
        </Field>
        <Field label="Position d'affichage" error={errors.position} hint="0 en premier.">
          <TextInput type="number" min="0" max="999" step="1" value={form.position} onChange={set('position')} />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Description" error={errors.text}>
          <textarea
            value={form.text}
            onChange={set('text')}
            maxLength={400}
            rows={3}
            className="mt-2 w-full border-2 border-neutral-300 p-3 font-semibold focus:border-neutral-950 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5">
        <ImageField
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
          token={token}
          error={errors.image}
        />
      </div>

      <div className="mt-8 flex gap-3">
        <ActionButton type="submit" busy={busy}>
          {category ? 'Enregistrer' : 'Créer'}
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
