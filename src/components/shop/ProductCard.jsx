import { Plus, Star } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export function ProductCard({ product, compact, onAdd }) {
  return (
    <article className={`product-card ${compact ? 'is-compact' : ''}`}>
      <a href={`#product/${product.id}`} className="product-media">
        <img src={product.image} alt={product.name} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </a>
      <div className="flex flex-1 flex-col p-4">
        <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.16em] text-neutral-500">{product.category}</span>
        <a href={`#product/${product.id}`} className="mt-2 font-['Archivo'] text-xl font-black uppercase leading-6 text-neutral-950 hover:text-red-700">
          {product.name}
        </a>
        <div className="mt-3 flex items-center gap-1 text-amber-600">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={`h-3.5 w-3.5 ${index < product.rating ? 'fill-current' : ''}`} />
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {product.oldPrice && <p className="text-xs font-bold text-neutral-400 line-through">{formatPrice(product.oldPrice)}</p>}
            <p className="font-['Archivo'] text-xl font-black text-red-700">{formatPrice(product.price)}</p>
          </div>
          <button className="add-cart-button" onClick={() => onAdd(product)} aria-label={`Ajouter ${product.name} au panier`}>
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
