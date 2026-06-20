import { categories, filters, products } from '../../data/shop';
import { ProductCard } from '../../components/shop/ProductCard';

const filterSlugs = {
  'Pièces moteur': 'pieces-moteur',
  Transmission: 'transmission',
  Diagnostic: 'diagnostic',
  Freinage: 'freinage',
  Climatisation: 'climatisation',
  Entretien: 'entretien',
};

export function CategoryPage({ slug, onAdd }) {
  const activeSlug = slug || 'all';
  const category = categories.find((item) => item.slug === activeSlug);
  const visibleProducts = activeSlug === 'all' ? products : products.filter((product) => product.categorySlug === activeSlug);

  return (
    <main className="bg-white">
      <section className="catalogue-hero">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="b-eyebrow">Catalogue technique</p>
          <h1 className="display mt-4 text-5xl sm:text-7xl">{category?.title || 'Tous les produits'}</h1>
          <p className="mt-5 max-w-2xl font-['Archivo'] text-lg font-semibold leading-8 text-neutral-600">
            {category?.text || 'Toute la sélection MR HONDA : diagnostic, outillage, freinage et électronique.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-10 flex gap-3 overflow-x-auto pb-2">
            <a className={`filter-chip ${activeSlug === 'all' ? 'is-active' : ''}`} href="#category/all">
              Tout
            </a>
            {filters
              .filter((item) => item !== 'Tout')
              .map((item) => {
                const itemSlug = filterSlugs[item];
                return (
                  <a key={item} className={`filter-chip ${activeSlug === itemSlug ? 'is-active' : ''}`} href={`#category/${itemSlug}`}>
                    {item}
                  </a>
                );
              })}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
