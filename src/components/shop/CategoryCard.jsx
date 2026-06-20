export function CategoryCard({ title, text, image, slug }) {
  return (
    <a href={`#category/${slug}`} className="category-card group">
      <img src={image} alt="" aria-hidden="true" />
      <div className="category-card-shade" />
      <div className="relative z-10">
        <h3>{title}</h3>
        <span />
        <p>{text}</p>
      </div>
    </a>
  );
}
