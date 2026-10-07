import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import { RoleName } from '../../types';
import { AuthAlert, AuthButton, AuthField, authLinkClass } from './AuthShell';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await login(email, password, rememberMe);

    // Redirection post-login
    const user = useAuthStore.getState().user;
    if (user) {
      if (user.activeRole?.name === RoleName.RECEPTIONIST) {
        navigate('/accueil');
      } else if (user.activeRole?.name === RoleName.CULTURAL_ADVISOR) {
        navigate('/culture');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <AuthAlert variant="error" title="Erreur de connexion" message={error} />}

      <AuthField
        id="login-email"
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

      <AuthField
        id="login-password"
        label="Mot de passe"
        icon={Lock}
        type={showPassword ? 'text' : 'password'}
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={showPassword}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45]/50 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100 dark:focus-visible:ring-[#5fc389]/60"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-400 accent-[#0b7f45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b7f45]/50 focus-visible:ring-offset-1 dark:border-gray-500 dark:focus-visible:ring-[#5fc389]/60 dark:focus-visible:ring-offset-gray-950"
          />
          Se souvenir de moi
        </label>
        <Link to="/reset-password" className={authLinkClass}>
          Mot de passe oublié ?
        </Link>
      </div>

      <AuthButton
        type="submit"
        loading={isLoading}
        loadingLabel="Connexion..."
        icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
      >
        Se connecter
      </AuthButton>
    </form>
  );
}
