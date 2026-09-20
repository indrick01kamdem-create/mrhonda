import { ProductCard } from '../../components/shop/ProductCard';
import { buildFilters, filterProducts, findCategory } from '../../utils/catalog';

export function CategoryPage({ slug, onAdd, products, categories }) {
  const activeSlug = slug || 'all';
  const category = findCategory(categories, activeSlug);
  const visibleProducts = filterProducts(products, activeSlug);
  const filters = buildFilters(categories);

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
            {filters.map((filter) => (
              <a
                key={filter.slug}
                className={`filter-chip ${activeSlug === filter.slug ? 'is-active' : ''}`}
                href={`#category/${filter.slug}`}
              >
                {filter.label}
              </a>
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
          </div>
          {visibleProducts.length === 0 && (
            <p className="py-16 text-center font-semibold text-neutral-500">
              Aucun produit dans cette catégorie pour le moment.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
