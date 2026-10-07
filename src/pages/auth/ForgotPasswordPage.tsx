// src/pages/auth/ForgotPasswordPage.tsx
//
// « Mot de passe oublié » en deux étapes :
//   1. l'agent saisit son email → un code à 6 chiffres lui est envoyé (réponse identique que le compte existe ou non) ;
//   2. il saisit le code + un nouveau mot de passe → toutes ses sessions sont fermées, il se reconnecte.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, Mail, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthField, AuthButton, AuthAlert, authLinkClass } from '../../components/auth/AuthShell';
import { api } from '../../lib/api';

const RESEND_DELAY_SECONDS = 60;

const passwordProblem = (pwd: string): string | null => {
  if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Za-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une lettre.';
  if (!/\d/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre.';
  return null;
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setStep('code');
      setCooldown(RESEND_DELAY_SECONDS);
      setInfo('Si un compte correspond à cette adresse, un code à 6 chiffres vient de lui être envoyé. Il est valable 15 minutes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : "La demande n'a pas pu être envoyée. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(otp.trim())) return setError('Saisissez le code à 6 chiffres reçu par email.');
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');

    setBusy(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), newPassword: password });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide ou expiré.');
    } finally {
      setBusy(false);
    }
  };

  const subtitle =
    step === 'email'
      ? 'Saisissez votre adresse email : nous vous envoyons un code de vérification.'
      : step === 'code'
        ? 'Saisissez le code reçu par email puis choisissez un nouveau mot de passe.'
        : 'Votre mot de passe a été modifié.';

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      aria-pressed={showPassword}
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45]/50 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100 dark:focus-visible:ring-[#5fc389]/60"
    >
      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </button>
  );

  return (
    <AuthShell title="Mot de passe oublié" subtitle={subtitle}>
      <div className="space-y-6">
        {error && <AuthAlert variant="error" title="Erreur" message={error} />}
        {info && !error && <AuthAlert variant="info" title="Code envoyé" message={info} />}

        {step === 'email' && (
          <form onSubmit={requestCode} className="space-y-6">
            <AuthField
              id="reset-email"
              label="Adresse email"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="username"
              placeholder="agent@ambassade.ml"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AuthButton type="submit" loading={busy} loadingLabel="Envoi…" disabled={!email.trim()}>
              Recevoir le code
            </AuthButton>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={submitReset} className="space-y-6">
            <AuthField
              id="reset-otp"
              label="Code à 6 chiffres"
              icon={KeyRound}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="tracking-[0.4em]"
              required
            />

            <AuthField
              id="reset-password"
              label="Nouveau mot de passe"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8 caractères minimum, lettres et chiffres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              trailing={passwordToggle}
            />

            <AuthField
              id="reset-confirm"
              label="Confirmer le mot de passe"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <AuthButton type="submit" loading={busy} loadingLabel="Enregistrement…">
              Réinitialiser le mot de passe
            </AuthButton>

            <button
              type="button"
              onClick={() => requestCode()}
              disabled={busy || cooldown > 0}
              className={`w-full ${authLinkClass} disabled:cursor-not-allowed disabled:text-gray-500 disabled:no-underline dark:disabled:text-gray-400`}
            >
              {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : 'Renvoyer le code'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-6">
            <AuthAlert
              variant="success"
              title="Mot de passe modifié"
              message="Pour votre sécurité, vous avez été déconnecté de tous vos appareils. Connectez-vous avec votre nouveau mot de passe."
            />
            <AuthButton type="button" onClick={() => navigate('/login')}>
              Se connecter
            </AuthButton>
          </div>
        )}

        {step !== 'done' && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex w-full items-center justify-center gap-1.5 rounded text-sm font-medium text-gray-600 transition hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45]/50 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-[#5fc389]/60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la connexion
          </button>
        )}
      </div>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
