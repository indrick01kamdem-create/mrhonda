import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImage } from '../../api/adminApi';
import { Field, TextInput } from './ui';

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageField({ value, onChange, token, error }) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Seules les images sont acceptées.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`Image trop lourde (${Math.round(file.size / 1024 / 1024)} Mo). Maximum 5 Mo.`);
      return;
    }

    setBusy(true);
    setUploadError('');
    try {
      const asset = await uploadImage(token, file);
      onChange(asset.url);
    } catch (failure) {
      setUploadError(failure.detail || "L'envoi de l'image a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Field label="Image" error={error || uploadError} hint="Téléversez un fichier ou collez une URL.">
        <TextInput
          type="url"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://res.cloudinary.com/..."
        />
      </Field>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 border-2 border-neutral-300 px-4 font-['Archivo'] text-xs font-black uppercase tracking-[.1em] hover:border-neutral-950 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? 'Envoi…' : 'Téléverser'}
        </button>
        {value && <img src={value} alt="" className="h-14 w-14 border-2 border-neutral-200 object-cover" />}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}
