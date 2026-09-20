export function buildFilters(categories) {
  return [
    { label: 'Tout', slug: 'all' },
    ...categories.map((category) => ({ label: category.title, slug: category.slug })),
  ];
}

export function findCategory(categories, slug) {
  if (!slug || slug === 'all') return null;
  return categories.find((category) => category.slug === slug) || null;
}

export function filterProducts(products, slug) {
  if (!slug || slug === 'all') return products;
  return products.filter((product) => product.categorySlug === slug);
}
