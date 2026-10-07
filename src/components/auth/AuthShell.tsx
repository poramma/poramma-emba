// Coquille visuelle commune aux écrans d'authentification (connexion, mot de passe oublié).
// Purement présentationnelle : aucune logique d'authentification ici.

import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const SEAL_SRC = '/images/logo/Sceau_de_Ambassade_du_Mali_Rabat.png';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panneau institutionnel (bandeau compact sur mobile, panneau complet dès lg) */}
      <aside className="relative isolate overflow-hidden bg-gradient-to-br from-[#04281a] via-[#06361f] to-[#0a4a2e] px-5 pb-5 pt-6 text-white lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        {/* Liseré tricolore tiré du sceau */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5">
          <span className="flex-1 bg-[#009e3a]" />
          <span className="flex-1 bg-[#fdd816]" />
          <span className="flex-1 bg-[#e30613]" />
        </div>

        {/* Motif discret : anneaux concentriques en écho au sceau */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -bottom-52 -left-52 -z-10 hidden h-[640px] w-[640px] text-white lg:block"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="300" cy="300" r="290" strokeOpacity="0.07" />
          <circle cx="300" cy="300" r="230" strokeOpacity="0.07" />
          <circle cx="300" cy="300" r="170" strokeOpacity="0.07" />
          <circle cx="300" cy="300" r="110" strokeOpacity="0.07" />
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-10 hidden h-80 w-80 rounded-full bg-[#fdd816]/[0.05] blur-3xl lg:block"
        />

        <div className="hidden lg:block" aria-hidden="true" />

        <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-10">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-lg shadow-black/30 ring-1 ring-white/30 lg:h-48 lg:w-48 lg:ring-4 lg:ring-white/10">
            <img
              src={SEAL_SRC}
              alt="Sceau de l'Ambassade du Mali à Rabat"
              width={192}
              height={192}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-1 lg:space-y-4">
            <p className="text-lg font-semibold leading-tight tracking-tight sm:text-xl lg:text-3xl lg:leading-[1.15] xl:text-4xl">
              Ambassade du Mali au Maroc
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-emerald-100/80 lg:text-base">
              <span className="font-semibold text-[#fdd816]">Poramma</span>
              <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden="true" />
              <span>Système de gestion consulaire</span>
            </div>
          </div>
        </div>

        <div className="hidden space-y-3 text-sm text-emerald-100/70 lg:block">
          <p className="max-w-sm leading-relaxed">
            Espace réservé au personnel habilité de l&apos;ambassade.
          </p>
          <p className="text-xs text-emerald-100/50">© {year} Ambassade du Mali au Maroc</p>
        </div>
      </aside>

      {/* Zone de formulaire */}
      <main className="flex flex-1 flex-col px-5 py-10 sm:px-10 lg:min-h-[100dvh] lg:px-16 lg:py-14">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-[1.75rem]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
            </header>
            {children}
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400 lg:hidden">
          © {year} Ambassade du Mali au Maroc
        </p>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Champs, bouton, messages                                            */
/* ------------------------------------------------------------------ */

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Élément à droite du champ (ex. bouton afficher/masquer). */
  trailing?: ReactNode;
  hint?: string;
}

export function AuthField({ id, label, icon: Icon, trailing, hint, className = '', ...inputProps }: AuthFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
        />
        <input
          id={id}
          aria-describedby={hintId}
          {...inputProps}
          className={`h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 text-sm text-gray-900 placeholder:text-gray-500 transition focus:border-[#0b7f45] focus:outline-none focus:ring-2 focus:ring-[#0b7f45]/35 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-[#5fc389] dark:focus:ring-[#5fc389]/40 ${
            trailing ? 'pr-11' : 'pr-3.5'
          } ${className}`}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-gray-600 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

interface AuthButtonProps {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  icon?: ReactNode;
}

export function AuthButton({
  children,
  loading = false,
  loadingLabel,
  disabled = false,
  type = 'submit',
  onClick,
  icon,
}: AuthButtonProps) {
  const inactive = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inactive}
      aria-busy={loading || undefined}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0b7f45] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#096b3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-[#5fc389] dark:focus-visible:ring-offset-gray-950"
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {loadingLabel ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

interface AuthAlertProps {
  variant: 'error' | 'info' | 'success';
  title: string;
  message: string;
}

export function AuthAlert({ variant, title, message }: AuthAlertProps) {
  const styles = {
    error:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100',
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100',
  }[variant];
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-lg border p-3.5 text-sm ${styles}`}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export const authLinkClass =
  'rounded text-sm font-medium text-[#0b7f45] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45]/50 dark:text-[#5fc389] dark:focus-visible:ring-[#5fc389]/60';
