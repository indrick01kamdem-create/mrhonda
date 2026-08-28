import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { listOrders, updateOrderStatus } from '../../api/adminApi';
import { formatPrice } from '../../utils/format';
import { Banner, SelectInput } from './ui';

const STATUSES = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'traitee', label: 'Traitée' },
  { value: 'annulee', label: 'Annulée' },
];

const FILTERS = [{ value: '', label: 'Toutes' }, ...STATUSES];

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function OrdersPanel({ request }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await request((token) => listOrders(token, filter || undefined)));
    } catch (failure) {
      setError(failure.detail || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [request, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order, status) => {
    setError('');
    try {
      await request((token) => updateOrderStatus(token, order.id, status));
      const label = STATUSES.find((item) => item.value === status)?.label ?? status;
      setNotice(`Commande ${order.reference} : ${label.toLowerCase()}.`);
      await load();
    } catch (failure) {
      setError(failure.detail || 'Changement de statut impossible');
    }
  };

  return (
    <>
      <Banner kind="error" message={error} onClose={() => setError('')} />
      <Banner message={notice} onClose={() => setNotice('')} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p className="font-semibold text-neutral-500">
          {loading ? 'Chargement…' : `${orders.length} commande${orders.length > 1 ? 's' : ''}`}
        </p>
        <label className="flex w-full items-center gap-3 sm:w-auto">
          <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
            Statut
          </span>
          <div className="w-full sm:w-44">
            <SelectInput value={filter} onChange={(event) => setFilter(event.target.value)}>
              {FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </label>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="border-2 border-neutral-950 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">
                  {order.reference} · {formatDate(order.created_at)}
                </p>
                <p className="mt-1 font-['Archivo'] text-lg font-black uppercase">{order.customer_name}</p>
                <a href={`tel:${order.customer_phone}`} className="font-semibold text-neutral-600 hover:text-red-700">
                  {order.customer_phone}
                </a>
                {order.customer_city && (
                  <span className="ml-2 font-semibold text-neutral-400">· {order.customer_city}</span>
                )}
              </div>
              <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.1em] text-neutral-400">Total articles</p>
                  <strong className="font-['Archivo'] text-xl text-red-700">{formatPrice(order.total)}</strong>
                </div>
                <div className="w-36 sm:w-40">
                  <SelectInput value={order.status} onChange={(event) => changeStatus(order, event.target.value)}>
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  aria-label="Voir les articles"
                  aria-expanded={expanded === order.id}
                  className="text-neutral-400 hover:text-neutral-950"
                >
                  {expanded === order.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {expanded === order.id && (
              <div className="border-t-2 border-neutral-200 bg-[#f9f9f8] p-4">
                <ul className="space-y-2">
                  {(order.items ?? []).map((item, index) => (
                    <li key={index} className="flex justify-between gap-4 font-semibold">
                      <span>
                        {item.name} <span className="text-neutral-500">x{item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-neutral-400">
                  Prix enregistrés au moment de la commande. Livraison non comprise.
                </p>
                {order.note && (
                  <p className="mt-4 border-l-4 border-neutral-300 pl-3 font-semibold text-neutral-600">
                    {order.note}
                  </p>
                )}
              </div>
            )}
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <p className="border-2 border-neutral-300 bg-white p-8 text-center font-semibold text-neutral-500">
            Aucune commande {filter ? 'avec ce statut' : 'pour le moment'}.
          </p>
        )}
      </div>
    </>
  );
}
