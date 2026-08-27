import { Loader2, X } from 'lucide-react';

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs font-semibold text-neutral-400">{hint}</span>}
      {error && <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span>}
    </label>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="mt-2 h-11 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none disabled:bg-neutral-100"
    />
  );
}

export function SelectInput({ children, ...props }) {
  return (
    <select
      {...props}
      className="mt-2 h-11 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
    >
      {children}
    </select>
  );
}

export function Banner({ kind = 'info', message, onClose }) {
  if (!message) return null;
  const tone =
    kind === 'error'
      ? 'border-red-700 bg-red-50 text-red-800'
      : 'border-emerald-700 bg-emerald-50 text-emerald-800';
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 border-2 px-4 py-3 font-semibold ${tone}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ActionButton({ busy, className = '', children, ...props }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-5 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] text-white hover:bg-red-700 hover:border-red-700 disabled:opacity-50 ${className}`}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
