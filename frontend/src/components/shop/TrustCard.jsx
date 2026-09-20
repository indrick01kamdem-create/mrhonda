export function TrustCard({ icon: Icon, title, text }) {
  return (
    <article className="border border-white/10 bg-white/[.06] p-5">
      <Icon className="h-8 w-8 text-red-500" />
      <h3 className="mt-4 font-['Archivo'] text-xl font-black uppercase">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-neutral-300">{text}</p>
    </article>
  );
}
