import { LogOut } from 'lucide-react';

const TABS = [
  { id: 'produits', label: 'Produits' },
  { id: 'categories', label: 'Catégories' },
  { id: 'commandes', label: 'Commandes' },
];

export function AdminLayout({ tab, email, onLogout, children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f9f9f8]">
      <header className="border-b-2 border-neutral-950 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="b-eyebrow">MR HONDA</p>
            <h1 className="font-['Archivo'] text-2xl font-black uppercase">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-semibold text-neutral-500 sm:inline">{email}</span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 font-['Archivo'] text-sm font-black uppercase tracking-[.1em] hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 sm:gap-2 sm:px-8">
          {TABS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`shrink-0 whitespace-nowrap border-b-4 px-3 py-3 font-['Archivo'] text-xs font-black uppercase tracking-[.08em] sm:px-4 sm:text-sm sm:tracking-[.1em] ${
                tab === item.id ? 'border-red-700 text-red-700' : 'border-transparent text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
