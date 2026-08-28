import { useState } from 'react';
import { ActionButton, Banner, Field, TextInput } from './ui';

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin({ email: email.trim(), password });
    } catch (failure) {
      setError(failure.detail || 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-neutral-950 px-5">
      <form onSubmit={submit} className="w-full max-w-sm border-2 border-white bg-white p-7">
        <p className="b-eyebrow">MR HONDA</p>
        <h1 className="mt-2 font-['Archivo'] text-3xl font-black uppercase">Administration</h1>
        <Banner kind="error" message={error} />
        <div className="mt-6 space-y-4">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Mot de passe">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>
        <ActionButton type="submit" busy={busy} className="mt-6 w-full">
          Se connecter
        </ActionButton>
      </form>
    </main>
  );
}
