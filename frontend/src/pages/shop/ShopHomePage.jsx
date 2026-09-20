import { MessageCircle, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { WA_NUMBER } from '../../data/shop';
import { formatPrice } from '../../utils/format';
import { CategoryCard } from '../../components/shop/CategoryCard';
import { ProductCard } from '../../components/shop/ProductCard';
import { ShopSectionIntro } from '../../components/shop/ShopSectionIntro';
import { TrustCard } from '../../components/shop/TrustCard';

export function ShopHomePage({ onAdd, products, categories }) {
  const featured = products[0];
  return (
    <main>
      <section className="shop-hero">
        <div className="shop-hero-bg" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_.92fr] lg:py-24">
          <div>
            <div className="shop-chip">Élite technique</div>
            <h1 className="display mt-6 max-w-4xl text-[clamp(54px,8vw,118px)] text-white">
              Équipez-vous
              <br />
              comme un <span className="text-red-500">pro</span>
            </h1>
            <p className="mt-7 max-w-xl font-['Archivo'] text-lg font-semibold leading-8 text-neutral-200 sm:text-xl">
              Outils de diagnostic, pièces fiables et équipements d'atelier pour mécaniciens exigeants.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a className="btn-skew p" href="#category/all">
                <span>Voir la boutique</span>
              </a>
              <a className="btn-skew hero-secondary" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
                <span>Commander via WhatsApp</span>
              </a>
            </div>
            <div className="mt-14 grid max-w-xl grid-cols-3 gap-5">
              <ShopStat value="24H" label="Réponse commande" />
              <ShopStat value="6+" label="Familles produit" />
              <ShopStat value="PRO" label="Sélection atelier" />
            </div>
          </div>
          <div className="hero-product-stage">
            {featured && (
              <a href={`#product/${featured.id}`} className="hero-product-card">
                <img src={featured.image} alt={featured.name} />
                <div className="hero-product-info">
                  <span>Produit phare</span>
                  <b>{featured.name}</b>
                  <strong>{formatPrice(featured.price)}</strong>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      <section id="categories" className="section">
        <ShopSectionIntro
          eyebrow="Navigation technique"
          title="Catégories populaires"
          text="Accédez vite aux pièces, outils et équipements de diagnostic les plus utiles en atelier."
        />
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} {...category} />
          ))}
        </div>
      </section>

      <section id="promos" className="border-y border-neutral-200 bg-[#f4f4f3] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="b-eyebrow">Offres limitées</p>
              <h2 className="display mt-3 text-5xl text-neutral-950 sm:text-7xl">
                Ventes flash <span className="text-red-700">-30%</span>
              </h2>
            </div>
            <div className="flash-timer" aria-label="Temps restant">
              <span>02</span>
              <span>14</span>
              <span>55</span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(1, 5).map((product) => (
              <ProductCard key={product.id} product={product} compact onAdd={onAdd} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="b-eyebrow">Service MR HONDA</p>
            <h2 className="display mt-4 text-5xl sm:text-7xl">Acheter l'outil, comprendre son usage.</h2>
            <p className="mt-6 max-w-xl font-['Archivo'] text-lg font-semibold leading-8 text-neutral-300">
              Besoin d'apprendre à utiliser une valise, lire une panne ou travailler proprement sur Honda ? La formation reste disponible comme un espace complet à part.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="btn-skew p" href="#formation">
                <span>Voir la formation</span>
              </a>
              <a className="btn-skew bg-white text-neutral-950" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
                <span>Demander conseil</span>
              </a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TrustCard icon={ShieldCheck} title="Garantie pro" text="Produits sélectionnés pour usage intensif en atelier." />
            <TrustCard icon={Truck} title="Livraison rapide" text="Commande préparée après confirmation WhatsApp." />
            <TrustCard icon={MessageCircle} title="Conseil direct" text="Un humain valide la compatibilité avant paiement." />
            <TrustCard icon={Wrench} title="Formation" text="Accompagnement disponible pour les outils complexes." />
          </div>
        </div>
      </section>
    </main>
  );
}

function ShopStat({ value, label }) {
  return (
    <div>
      <div className="display text-4xl text-white sm:text-5xl">{value}</div>
      <div className="mt-2 font-['Archivo'] text-[11px] font-black uppercase tracking-[.14em] text-neutral-400">{label}</div>
    </div>
  );
}
