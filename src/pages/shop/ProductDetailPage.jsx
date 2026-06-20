import { CheckCircle2, Star } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export function ProductDetailPage({ product, onAdd }) {
  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <p className="b-eyebrow">Produit introuvable</p>
        <h1 className="mt-4 text-4xl font-black">Ce produit n'existe pas dans le catalogue.</h1>
        <a className="btn-skew p mt-8" href="#category/all">
          <span>Retour au catalogue</span>
        </a>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-7">
          <div className="product-detail-gallery">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {[product.image, product.image, product.image, product.image].map((image, index) => (
              <div key={index} className={`product-thumb ${index === 0 ? 'is-active' : ''}`}>
                <img src={image} alt="" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
        <aside className="product-detail-info lg:col-span-5">
          <p className="b-eyebrow">{product.category}</p>
          <h1 className="mt-3 font-['Archivo'] text-4xl font-black uppercase leading-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-2 text-amber-600">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className={`h-4 w-4 ${index < product.rating ? 'fill-current' : ''}`} />
            ))}
            <span className="ml-2 text-xs font-black uppercase tracking-[.1em] text-neutral-500">(avis atelier)</span>
          </div>
          <div className="technical-price mt-7">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
            <p>Prix indicatif. Compatibilité confirmée par WhatsApp avant paiement.</p>
          </div>
          <div className="mt-7">
            <h2 className="font-['Archivo'] text-sm font-black uppercase tracking-[.12em]">Points forts</h2>
            <ul className="mt-4 grid gap-3">
              {product.specs.map((spec) => (
                <li key={spec} className="flex gap-3 font-semibold text-neutral-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  {spec}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="btn-skew p flex-1" onClick={() => onAdd(product)}>
              <span>Ajouter au panier</span>
            </button>
            <a className="btn-skew g flex-1" href="#panier">
              <span>Voir panier</span>
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}
