// src/pages/auth/ForgotPasswordPage.tsx
//
// « Mot de passe oublié » en deux étapes :
//   1. l'agent saisit son email → un code à 6 chiffres lui est envoyé (réponse identique que le compte existe ou non) ;
//   2. il saisit le code + un nouveau mot de passe → toutes ses sessions sont fermées, il se reconnecte.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, KeyRound, Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
            <p className="text-sm text-gray-500">
              {step === 'email' && 'Saisissez votre adresse email : nous vous envoyons un code de vérification.'}
              {step === 'code' && 'Saisissez le code reçu par email puis choisissez un nouveau mot de passe.'}
              {step === 'done' && 'Votre mot de passe a été modifié.'}
            </p>
          </div>

          {error && <Alert title="Erreur" variant="destructive" message={error} />}
          {info && !error && <Alert title="Code envoyé" variant="info" message={info} />}

          {step === 'email' && (
            <form onSubmit={requestCode} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input type="email" placeholder="agent@ambassade.ml" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy || !email.trim()}>
                {busy ? 'Envoi…' : 'Recevoir le code'}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={submitReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Code à 6 chiffres</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 tracking-[0.4em]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="8 caractères minimum, lettres et chiffres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10" required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
              </Button>

              <button
                type="button"
                onClick={() => requestCode()}
                disabled={busy || cooldown > 0}
                className="w-full text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
              >
                {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : 'Renvoyer le code'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <Alert title="Mot de passe modifié" variant="success" message="Pour votre sécurité, vous avez été déconnecté de tous vos appareils. Connectez-vous avec votre nouveau mot de passe." />
              <Button className="w-full" onClick={() => navigate('/login')}>
                Se connecter
              </Button>
            </div>
          )}

          {step !== 'done' && (
            <button type="button" onClick={() => navigate('/login')} className="flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </button>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Ambassade du Mali au Maroc</p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
