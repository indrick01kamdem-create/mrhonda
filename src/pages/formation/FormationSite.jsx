import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, CalendarDays, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { WA_NUMBER } from '../../data/shop';
import { START_DATE, experiences, goals, levels, programs, sources } from '../../data/training';

export function FormationSite({ initialPage = 'home', anchor }) {
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    if (anchor) {
      window.requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [anchor]);

  const goHome = () => {
    window.location.hash = 'formation';
    setPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goRegister = () => {
    window.location.hash = 'inscription';
    setPage('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-950">
      <FormationHeader page={page} onHome={goHome} onRegister={goRegister} />
      {page === 'home' ? <FormationHomePage onRegister={goRegister} /> : <RegisterPage onHome={goHome} />}
      <FormationFooter onRegister={goRegister} />
    </div>
  );
}

function FormationHeader({ page, onHome, onRegister }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <button onClick={onHome} className="flex items-center" aria-label="Retour à l'accueil">
          <img src="/asset/logo.png" alt="MR HONDA" className="h-10 w-auto" />
        </button>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-neutral-600 md:flex">
          <button onClick={onHome} className="hover:text-red-700">
            Accueil
          </button>
          {page === 'home' && (
            <>
              <a href="#filieres" className="hover:text-red-700">
                Filières
              </a>
              <a href="#parcours" className="hover:text-red-700">
                Parcours
              </a>
              <a href="#diagnostic" className="hover:text-red-700">
                Diagnostic
              </a>
            </>
          )}
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="hover:text-red-700">
            WhatsApp
          </a>
        </nav>
        <button className="btn-skew p !h-11 !px-5 !text-sm" onClick={onRegister}>
          <span>S'inscrire</span>
        </button>
      </div>
    </header>
  );
}

function FormationHomePage({ onRegister }) {
  return (
    <main>
      <section className="perf-hero relative flex items-center overflow-hidden">
        <img className="hero-bg-image" src="/asset/image.jpeg" alt="" aria-hidden="true" />
        <div className="hero-bg-wash" aria-hidden="true" />
        <div className="hero-red-rule" aria-hidden="true">
          <span />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="stripes h-1 w-16" />
            <span className="b-eyebrow">Yaoundé · Rentrée {START_DATE}</span>
          </div>
          <h1 className="display perf-title m-0">
            Apprends.
            <br />
            <span className="red">Répare.</span>
            <br />
            <span className="out">Domine.</span>
          </h1>
          <p className="mt-8 max-w-xl font-['Archivo'] text-xl font-semibold leading-8 text-neutral-700">
            Formation intensive en mécanique, mécatronique et diagnostic automobile. On te met les mains dans le cambouis dès le premier jour.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button className="btn-skew p" onClick={onRegister}>
              <span>S'inscrire maintenant</span>
            </button>
            <a className="btn-skew g" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
              <span>WhatsApp</span>
            </a>
          </div>
          <div className="mt-14 flex flex-wrap gap-12">
            <Stat value="4" label="Filières" />
            <Stat value="3M" label="Diagnostic express" highlight />
            <Stat value="100%" label="Pratique atelier" highlight />
          </div>
        </div>
      </section>

      <section id="filieres" className="section bg-[#fbfaf8]">
        <SectionIntro
          eyebrow="Les filières"
          title={
            <>
              Choisis ton <span className="text-red-600">terrain</span>
            </>
          }
          text="Quatre métiers, une seule exigence : que tu sortes d'ici prêt à bosser. La durée s'adapte à ton niveau et ton expérience."
        />
        <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 md:grid-cols-2">
          {programs.map((program, index) => (
            <ProgramCard key={program.title} index={index + 1} {...program} />
          ))}
        </div>
      </section>

      <section id="parcours" className="section border-t border-neutral-200 bg-white">
        <SectionIntro
          eyebrow="Ton rythme"
          title={
            <>
              Combien de <span className="text-red-600">temps</span> ?
            </>
          }
          text="Plus tu as de bases, plus tu vas vite. On calibre ton parcours sur ton niveau scolaire et ton expérience."
        />
        <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 lg:grid-cols-3">
          <PathCard eyebrow="Débutant total" duration="3 ANS" text="Sans BEPC, jamais touché à un moteur. On construit des bases solides, étape par étape." />
          <PathCard eyebrow="BEPC · Bac · expérience" duration="2 ANS" text="Bon niveau scolaire et un passage en garage ? Tu accélères vers l'autonomie." />
          <PathCard eyebrow="Spécialisation" duration="3 MOIS" text="Diagnostic à la valise. Et électronique en 1 an si tu es déjà mécanicien." />
        </div>
      </section>

      <HondaKnowledgeCallout onRegister={onRegister} />

      <section id="diagnostic" className="diagnostic-panel section">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <div className="obd-visual grid place-items-center p-6">
            <div className="w-full max-w-md border border-neutral-300 bg-neutral-950 p-5 text-white shadow-2xl shadow-neutral-300/70">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-['Archivo'] text-sm font-black tracking-[.18em] text-neutral-300">VALISE OBD</span>
                <span className="h-3 w-3 rounded-full bg-red-500" />
              </div>
              <div className="space-y-3">
                {['P0301 · Raté cylindre', 'Batterie · 12.4V', 'Capteur O2 · Analyse'].map((item) => (
                  <div key={item} className="flex items-center justify-between border border-white/10 bg-white/[.05] px-4 py-3 text-sm font-semibold">
                    <span>{item}</span>
                    <BadgeCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="b-eyebrow">Équipement moderne</p>
            <h2 className="display mt-4 text-5xl text-neutral-950 sm:text-7xl">
              La <span className="text-red-600">valise</span>, dès le départ.
            </h2>
            <p className="mt-6 max-w-xl font-['Archivo'] text-lg font-semibold leading-8 text-neutral-700">
              La voiture d'aujourd'hui est électronique. Ici tu branches la valise et tu lis la panne, comme dans un vrai garage.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                'Lecture & effacement des codes défauts (OBD)',
                "Analyse rapide d'une panne en conditions réelles",
                'Une compétence rare, très demandée des employeurs',
                'Accessible en 3 mois, quel que soit ton niveau',
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-4 font-['Archivo'] text-base font-bold text-neutral-700">
                  <b className="display min-w-9 text-xl text-red-600">{String(index + 1).padStart(2, '0')}</b>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-red-700 py-28 text-center text-white">
        <div className="stripes absolute inset-0 opacity-15" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8">
          <h2 className="display text-5xl sm:text-8xl">
            Prêt à
            <br />
            démarrer ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-['Archivo'] text-lg font-semibold leading-8 text-red-50">
            La rentrée, c'est le {START_DATE}. Dépose ton dossier maintenant.
          </p>
          <div className="mt-9 flex justify-center">
            <button className="btn-skew bg-white text-red-700" onClick={onRegister}>
              <span>Je m'inscris</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function RegisterPage({ onHome }) {
  const [values, setValues] = useState({
    nom: '',
    whatsapp: '',
    age: '',
    quartier: '',
    ville: 'Yaoundé',
    niveau: '',
    experience: '',
    filiere: '',
    objectif: '',
    garage: '',
    source: '',
  });
  const [errors, setErrors] = useState({});
  const required = ['nom', 'whatsapp', 'ville', 'niveau', 'experience', 'filiere', 'objectif'];

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: false }));
  };

  const submit = () => {
    const nextErrors = Object.fromEntries(required.map((key) => [key, !values[key].trim()]));
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      document.querySelector('[data-form-start]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const filled = (value) => value?.trim() || 'Non renseigné';
    const lines = [
      "Bonjour MR HONDA, je souhaite m'inscrire à la formation.",
      '',
      'DOSSIER D’INSCRIPTION',
      `Nom et prénom : ${filled(values.nom)}`,
      `Numéro WhatsApp : ${filled(values.whatsapp)}`,
      `Âge : ${filled(values.age)}`,
      `Quartier : ${filled(values.quartier)}`,
      `Ville : ${filled(values.ville)}`,
      `Niveau scolaire : ${filled(values.niveau)}`,
      `Expérience en mécanique : ${filled(values.experience)}`,
      `Filière souhaitée : ${filled(values.filiere)}`,
      `Objectif : ${filled(values.objectif)}`,
      `Déjà travaillé en garage : ${filled(values.garage)}`,
      `Comment j’ai connu MR HONDA : ${filled(values.source)}`,
      `Début souhaité : ${START_DATE}`,
    ];

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const completeCount = useMemo(() => required.filter((key) => values[key].trim()).length, [values]);

  return (
    <main>
      <section className="border-b border-neutral-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <button onClick={onHome} className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-red-700">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <p className="eyebrow-dark">Inscription · Promotion septembre 2026</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">Réserve ta place à l'atelier.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-650">
            Remplis les informations essentielles. Un conseiller confirme ensuite ton parcours, la durée et le coût adaptés à ton profil.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_380px]" data-form-start>
        <div className="space-y-8">
          <FormBlock number="1" title="Votre identité" invalid={errors.nom || errors.whatsapp} message="Merci d'indiquer votre nom et votre numéro WhatsApp.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nom et prénom" required value={values.nom} error={errors.nom} onChange={(value) => setValue('nom', value)} placeholder="ex. Jean Mbarga" />
              <TextField label="Numéro WhatsApp" required value={values.whatsapp} error={errors.whatsapp} onChange={(value) => setValue('whatsapp', value)} placeholder="ex. 6 99 00 00 00" inputMode="tel" />
            </div>
            <TextField label="Âge" value={values.age} onChange={(value) => setValue('age', value)} placeholder="ex. 19" inputMode="numeric" className="max-w-48" />
          </FormBlock>

          <FormBlock number="2" title="Localisation" invalid={errors.ville} message="Merci d'indiquer votre ville.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Quartier" value={values.quartier} onChange={(value) => setValue('quartier', value)} placeholder="ex. Biyem-Assi" />
              <TextField label="Ville" required value={values.ville} error={errors.ville} onChange={(value) => setValue('ville', value)} />
            </div>
          </FormBlock>

          <FormBlock number="3" title="Niveau scolaire" invalid={errors.niveau} message="Sélectionnez votre niveau scolaire.">
            <ChipGroup options={levels} value={values.niveau} onChange={(value) => setValue('niveau', value)} />
          </FormBlock>
          <FormBlock number="4" title="Expérience en mécanique" invalid={errors.experience} message="Indiquez votre niveau d'expérience.">
            <OptionGrid options={experiences} value={values.experience} onChange={(value) => setValue('experience', value)} />
          </FormBlock>
          <FormBlock number="5" title="Filière souhaitée" invalid={errors.filiere} message="Choisissez une filière.">
            <OptionGrid options={programs.map((p) => [p.title, `${p.duration} · ${p.price}`])} value={values.filiere} onChange={(value) => setValue('filiere', value)} />
          </FormBlock>
          <FormBlock number="6" title="Votre objectif" invalid={errors.objectif} message="Indiquez votre objectif principal.">
            <ChipGroup options={goals} value={values.objectif} onChange={(value) => setValue('objectif', value)} />
          </FormBlock>
          <FormBlock number="7" title="Avez-vous déjà travaillé dans un garage ?">
            <ChipGroup options={['Oui', 'Non']} value={values.garage} onChange={(value) => setValue('garage', value)} />
          </FormBlock>
          <FormBlock number="8" title="Comment nous avez-vous connus ?" optional>
            <ChipGroup options={sources} value={values.source} onChange={(value) => setValue('source', value)} />
          </FormBlock>
        </div>

        <aside className="h-max rounded-[8px] border border-neutral-200 bg-white shadow-xl shadow-neutral-200/70 lg:sticky lg:top-28">
          <div className="border-b border-neutral-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-black">Votre dossier</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                {completeCount}/{required.length}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-600">
              <CalendarDays className="h-4 w-4 text-red-700" />
              Début des cours: <b className="text-neutral-950">{START_DATE}</b>
            </div>
          </div>
          <div className="grid gap-3 p-6">
            <RecapRow label="Candidat" value={values.nom} fallback="À renseigner" />
            <RecapRow label="Niveau" value={values.niveau} />
            <RecapRow label="Expérience" value={values.experience} />
            <RecapRow label="Filière" value={values.filiere} />
            <RecapRow label="Objectif" value={values.objectif} />
          </div>
          <div className="border-t border-neutral-200 p-6">
            <button className="btn-whatsapp h-14 w-full px-5" onClick={submit}>
              <MessageCircle className="h-5 w-5" />
              Envoyer mon inscription
            </button>
            <p className="mt-4 flex items-start gap-2 text-center text-xs font-medium leading-5 text-neutral-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Aucun paiement maintenant. On vous rappelle pour confirmer.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-10 flex max-w-7xl flex-col justify-between gap-5 px-5 sm:px-8 lg:flex-row lg:items-end">
      <div>
        <p className="b-eyebrow">{eyebrow}</p>
        <h2 className="display mt-3 max-w-3xl text-5xl text-neutral-950 sm:text-7xl">{title}</h2>
      </div>
      <p className="max-w-xl font-['Archivo'] text-base font-semibold leading-7 text-neutral-700 sm:text-lg">{text}</p>
    </div>
  );
}

function HondaKnowledgeCallout({ onRegister }) {
  return (
    <section className="border-y border-neutral-200 bg-neutral-950 py-20 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="b-eyebrow">Bases Honda · Savoir d’atelier</p>
          <h2 className="display mt-4 max-w-4xl text-5xl sm:text-7xl">
            Des notions solides, transmises par des spécialistes Honda.
          </h2>
          <p className="mt-6 max-w-2xl font-['Archivo'] text-lg font-semibold leading-8 text-neutral-300">
            En plus de la mécanique automobile générale, nous te transmettons les méthodes,
            réflexes et notions techniques que nous avons développés sur les véhicules Honda.
            Tu apprends à comprendre la panne, à raisonner proprement et à travailler comme un
            vrai technicien d’atelier.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="btn-skew p" onClick={onRegister}>
              <span>Rejoindre la formation</span>
            </button>
            <a className="btn-skew bg-white text-neutral-950" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
              <span>Poser une question</span>
            </a>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            ['01', 'Mécanique auto', 'Les bases utiles pour intervenir avec méthode.'],
            ['02', 'Culture Honda', 'Des repères issus de notre spécialité terrain.'],
            ['03', 'Pratique atelier', 'Des exercices concrets pour progresser vite.'],
          ].map(([number, title, text]) => (
            <div key={title} className="border border-white/10 bg-white/[.06] p-5">
              <span className="display text-4xl text-red-500">{number}</span>
              <h3 className="mt-3 font-['Archivo'] text-xl font-black uppercase">{title}</h3>
              <p className="mt-2 font-['Archivo'] text-sm font-semibold leading-6 text-neutral-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCard({ title, description, duration, price, icon: Icon, index }) {
  return (
    <article className="perf-card flex flex-col justify-between">
      <span className="bignum display">{String(index).padStart(2, '0')}</span>
      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <div className="perf-icon">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-['Archivo'] text-2xl font-black uppercase text-neutral-950">{title}</h3>
        </div>
        <p className="mt-5 font-['Archivo'] text-base font-semibold leading-7 text-neutral-700">{description}</p>
      </div>
      <div className="relative z-10 mt-8 flex items-center justify-between border-t border-neutral-200 pt-5">
        <span className="font-['Archivo'] text-xs font-black uppercase tracking-[.08em] text-neutral-800">{duration} · selon profil</span>
        <span className="display text-3xl text-red-600">{price === '150 000 FCFA' ? '150K' : 'Devis'}</span>
      </div>
    </article>
  );
}

function PathCard({ eyebrow, duration, text }) {
  return (
    <article className="perf-card min-h-0">
      <p className="b-eyebrow">{eyebrow}</p>
      <h3 className="display mt-4 text-6xl text-neutral-950">
        {duration.split(' ')[0]} <span className="text-red-600">{duration.split(' ').slice(1).join(' ')}</span>
      </h3>
      <p className="mt-5 font-['Archivo'] text-base font-semibold leading-7 text-neutral-700">{text}</p>
    </article>
  );
}

function Stat({ value, label, highlight }) {
  return (
    <div>
      <div className="display text-5xl text-neutral-950">
        {highlight && value.endsWith('%') ? (
          <>
            100<span className="text-red-600">%</span>
          </>
        ) : highlight && value.endsWith('M') ? (
          <>
            3<span className="text-red-600">M</span>
          </>
        ) : (
          value
        )}
      </div>
      <div className="mt-2 font-['Archivo'] text-xs font-black uppercase tracking-[.14em] text-neutral-500">{label}</div>
    </div>
  );
}

function FormBlock({ number, title, optional, invalid, message, children }) {
  return (
    <section className={`rounded-[8px] border bg-white p-5 shadow-sm sm:p-6 ${invalid ? 'border-red-300' : 'border-neutral-200'}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 text-sm font-black text-red-700">{number}</span>
        <h2 className="text-lg font-black">{title}</h2>
        {optional && <span className="ml-auto text-xs font-bold text-neutral-400">facultatif</span>}
      </div>
      <div className="space-y-4">{children}</div>
      {invalid && <p className="mt-4 text-sm font-bold text-red-700">{message}</p>}
    </section>
  );
}

function TextField({ label, required, value, onChange, placeholder, inputMode, error, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-neutral-700">
        {label} {required && <span className="text-red-700">*</span>}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`h-12 w-full rounded-[8px] border bg-stone-50 px-4 text-base font-semibold outline-none transition focus:border-red-600 focus:bg-white ${error ? 'border-red-300' : 'border-neutral-200'}`}
      />
    </label>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
            value === option ? 'border-red-700 bg-red-700 text-white' : 'border-neutral-200 bg-stone-50 text-neutral-700 hover:border-red-200 hover:bg-red-50'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function OptionGrid({ options, value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(([title, subtitle]) => (
        <button
          type="button"
          key={title}
          onClick={() => onChange(title)}
          className={`rounded-[8px] border p-4 text-left transition ${
            value === title ? 'border-red-700 bg-red-50 text-red-950' : 'border-neutral-200 bg-stone-50 text-neutral-800 hover:border-red-200'
          }`}
        >
          <span className="block font-black">{title}</span>
          <span className="mt-1 block text-sm font-semibold text-neutral-500">{subtitle}</span>
        </button>
      ))}
    </div>
  );
}

function RecapRow({ label, value, fallback = '-' }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-neutral-500">{label}</span>
      <span className={`text-right font-black ${value ? 'text-neutral-950' : 'text-neutral-400'}`}>{value || fallback}</span>
    </div>
  );
}

function FormationFooter({ onRegister }) {
  return (
    <footer className="border-t border-neutral-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <img src="/asset/logo.png" alt="MR HONDA" className="h-10 w-auto" />
          <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-neutral-600">Centre de formation en mécanique automobile à Yaoundé. De la passion à la maîtrise.</p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-neutral-600">
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="hover:text-red-700">
            WhatsApp · +237 693 27 11 26
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-700" />
            Yaoundé, Cameroun
          </span>
          <button onClick={onRegister} className="text-left font-black text-red-700">
            S'inscrire
          </button>
        </div>
      </div>
    </footer>
  );
}
