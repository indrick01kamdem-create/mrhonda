import { RefreshCw, WifiOff } from 'lucide-react';

export function ErrorState({ error, onRetry }) {
  const offline = error?.status === 0;

  return (
    <div className="flex flex-col items-center gap-4 border-2 border-neutral-200 bg-white px-6 py-16 text-center">
      <WifiOff className="h-10 w-10 text-neutral-300" />
      <h3 className="font-['Archivo'] text-2xl font-black uppercase">
        {offline ? 'Serveur injoignable' : 'Catalogue indisponible'}
      </h3>
      <p className="max-w-md font-semibold text-neutral-600">
        {offline
          ? "Vérifiez votre connexion internet, puis réessayez."
          : error?.detail || "Le catalogue n'a pas pu être chargé."}
      </p>
      <button className="btn-skew p mt-2" onClick={onRetry}>
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </span>
      </button>
    </div>
  );
}
