export function ShopSectionIntro({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-10 flex max-w-7xl flex-col justify-between gap-5 px-5 sm:px-8 lg:flex-row lg:items-end">
      <div className="border-l-8 border-red-700 pl-5">
        <p className="b-eyebrow">{eyebrow}</p>
        <h2 className="display mt-3 max-w-3xl text-5xl text-neutral-950 sm:text-7xl">{title}</h2>
      </div>
      <p className="max-w-xl font-['Archivo'] text-base font-semibold leading-7 text-neutral-700 sm:text-lg">{text}</p>
    </div>
  );
}
