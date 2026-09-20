import { MapPin } from 'lucide-react';
import { WA_NUMBER } from '../../data/shop';

export function ShopFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <img src="/asset/logo.png" alt="MR HONDA" className="h-10 w-auto" />
          <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-neutral-600">
            Boutique d'outillage, pièces et diagnostic automobile. Conseil direct pour commander juste.
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-neutral-600">
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="hover:text-red-700">
            WhatsApp · +237 693 27 11 26
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-700" />
            Yaoundé, Cameroun
          </span>
          <a href="#formation" className="font-black text-red-700">
            Formation atelier
          </a>
        </div>
      </div>
    </footer>
  );
}
