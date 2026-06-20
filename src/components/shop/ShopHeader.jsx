import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { WA_NUMBER } from '../../data/shop';

export function ShopHeader({ cartCount, menuOpen, onToggleMenu }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button className="icon-button md:hidden" onClick={onToggleMenu} aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="#" className="flex items-center" aria-label="Accueil boutique">
            <img src="/asset/logo.png" alt="MR HONDA" className="h-10 w-auto" />
          </a>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-neutral-600 md:flex">
          <a href="#" className="hover:text-red-700">
            Boutique
          </a>
          <a href="#category/pieces-moteur" className="hover:text-red-700">
            Pièces
          </a>
          <a href="#category/transmission" className="hover:text-red-700">
            Transmission
          </a>
          <a href="#category/diagnostic" className="hover:text-red-700">
            Diagnostic
          </a>
          <a href="#formation" className="hover:text-red-700">
            Formation
          </a>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="hover:text-red-700">
            WhatsApp
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a className="icon-button hidden sm:grid" href="#category/all" aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </a>
          <a className="cart-button" href="#panier" aria-label="Ouvrir le panier">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span>{cartCount}</span>}
          </a>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white px-5 py-4 shadow-xl shadow-neutral-200/60 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-3 text-sm font-black uppercase tracking-[.08em] text-neutral-700">
            <a href="#" className="mobile-menu-link">
              Boutique
            </a>
            <a href="#category/all" className="mobile-menu-link">
              Catalogue
            </a>
            <a href="#panier" className="mobile-menu-link">
              Panier
            </a>
            <a href="#formation" className="mobile-menu-link">
              Formation atelier
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
