import { useState } from 'react';
import { MessageCircle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { CheckoutDialog } from '../../components/shop/CheckoutDialog';
import { formatPrice } from '../../utils/format';

export function CartPage({ cart, onAdd, onSubtract, onRemove }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cart.length ? 2500 : 0;
  const total = subtotal + shipping;
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <main className="bg-[#f9f9f8]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="b-eyebrow">Commande</p>
        <h1 className="display mt-3 text-5xl sm:text-7xl">Votre panier</h1>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {cart.length === 0 ? (
            <div className="empty-cart min-h-[360px] bg-white">
              <ShoppingCart className="h-12 w-12 text-neutral-300" />
              <h3>Panier vide</h3>
              <p>Ajoutez un outil ou une pièce depuis le catalogue.</p>
              <a className="btn-skew p mt-4" href="#category/all">
                <span>Voir le catalogue</span>
              </a>
            </div>
          ) : (
            cart.map((item) => (
              <article key={item.id} className="cart-page-line">
                <img src={item.image} alt="" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">Ref: {item.id}</p>
                  <a href={`#product/${item.id}`} className="mt-1 block font-['Archivo'] text-xl font-black uppercase hover:text-red-700">
                    {item.name}
                  </a>
                  <div className="mt-5 flex items-center gap-2">
                    <button onClick={() => onSubtract(item.id)} aria-label="Diminuer">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onAdd(item.id)} aria-label="Augmenter">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between gap-4">
                  <button className="text-neutral-400 hover:text-red-700" onClick={() => onRemove(item.id)} aria-label="Retirer">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <strong className="font-['Archivo'] text-xl text-red-700">{formatPrice(item.price * item.quantity)}</strong>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="order-summary lg:col-span-4">
          <h2 className="font-['Archivo'] text-xl font-black uppercase">Résumé de la commande</h2>
          <CartTotalRow label="Sous-total" value={subtotal} />
          <CartTotalRow label="Livraison" value={shipping} />
          <div className="mt-2 flex justify-between border-t-2 border-red-700 pt-5 text-red-700">
            <span className="font-['Archivo'] text-xl font-black uppercase">Total</span>
            <b className="font-['Archivo'] text-xl">{formatPrice(total)}</b>
          </div>
          <button className="btn-whatsapp mt-6 h-14 w-full px-5" disabled={!cart.length} onClick={() => setCheckoutOpen(true)}>
            <MessageCircle className="h-5 w-5" />
            Commander sur WhatsApp
          </button>
        </aside>
      </section>
      {checkoutOpen && (
        <CheckoutDialog
          cart={cart}
          subtotal={subtotal}
          shipping={shipping}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </main>
  );
}

function CartTotalRow({ label, value }) {
  return (
    <div className="mt-5 flex justify-between font-semibold text-neutral-600">
      <span>{label}</span>
      <b className="text-neutral-950">{formatPrice(value)}</b>
    </div>
  );
}
