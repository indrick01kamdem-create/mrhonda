import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { fieldErrors } from '../../api/client';
import { createOrder } from '../../api/orders';
import { WA_NUMBER } from '../../data/shop';
import { formatPrice } from '../../utils/format';

const EMPTY = { customer_name: '', customer_phone: '', customer_city: '', note: '' };

export function CheckoutDialog({ cart, subtotal, shipping, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const openWhatsApp = (reference) => {
    const lines = [
      'Bonjour MR HONDA, je souhaite commander :',
      '',
      ...cart.map((item) => `- ${item.name} x${item.quantity} : ${formatPrice(item.price * item.quantity)}`),
      '',
      `Sous-total : ${formatPrice(subtotal)}`,
      `Livraison estimée : ${formatPrice(shipping)}`,
      `Total estimé : ${formatPrice(subtotal + shipping)}`,
      '',
      `Client : ${form.customer_name} — ${form.customer_phone}`,
    ];
    if (form.customer_city) lines.push(`Ville : ${form.customer_city}`);
    if (form.note) lines.push(`Note : ${form.note}`);
    if (reference) lines.push('', `Référence commande : ${reference}`);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const result = await createOrder({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_city: form.customer_city.trim() || null,
        note: form.note.trim() || null,
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      });
      openWhatsApp(result.reference);
      onClose();
    } catch (error) {
      setErrors(fieldErrors(error.body));
      setMessage(error.detail || "L'enregistrement de la commande a échoué.");
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/70 p-0 sm:items-center sm:p-6">
      <div className="max-h-full w-full max-w-lg overflow-y-auto border-2 border-neutral-950 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="b-eyebrow">Finaliser</p>
            <h2 className="mt-2 font-['Archivo'] text-3xl font-black uppercase">Vos coordonnées</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-neutral-400 hover:text-red-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-3 font-semibold text-neutral-600">
          Nous enregistrons votre commande, puis WhatsApp s'ouvre avec le récapitulatif.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <CheckoutField
            label="Nom complet"
            value={form.customer_name}
            onChange={update('customer_name')}
            error={errors.customer_name}
            required
            minLength={2}
          />
          <CheckoutField
            label="Téléphone"
            type="tel"
            value={form.customer_phone}
            onChange={update('customer_phone')}
            error={errors.customer_phone}
            required
            minLength={6}
          />
          <CheckoutField
            label="Ville (optionnel)"
            value={form.customer_city}
            onChange={update('customer_city')}
            error={errors.customer_city}
          />
          <CheckoutField
            label="Note (optionnel)"
            value={form.note}
            onChange={update('note')}
            error={errors.note}
          />

          {message && (
            <p className="border-2 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800">{message}</p>
          )}

          <button type="submit" className="btn-whatsapp h-14 w-full px-5" disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {submitting ? 'Enregistrement…' : 'Valider et ouvrir WhatsApp'}
          </button>

          {failed && (
            <button
              type="button"
              className="w-full font-['Archivo'] text-sm font-black uppercase tracking-[.1em] text-neutral-500 underline hover:text-red-700"
              onClick={() => {
                openWhatsApp(null);
                onClose();
              }}
            >
              Continuer sur WhatsApp sans enregistrer
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function CheckoutField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
        {label}
      </span>
      <input
        {...props}
        className="mt-2 h-12 w-full border-2 border-neutral-300 px-3 font-semibold focus:border-neutral-950 focus:outline-none"
      />
      {error && <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span>}
    </label>
  );
}
