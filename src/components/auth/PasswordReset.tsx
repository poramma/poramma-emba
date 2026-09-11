import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert } from '../ui/alert';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function PasswordReset() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // ─── INTEGRATION BACKEND ──────────────────────────────────────────
    // await api.post('/auth/password/reset-request', { email });
    // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────

    // MOCK
    await new Promise(r => setTimeout(r, 1000));
    console.log('[MOCK] Email de réinitialisation envoyé à', email);
    
    setIsLoading(false);
    setStep('code');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // ─── INTEGRATION BACKEND ──────────────────────────────────────────
    // await api.post('/auth/password/verify-code', { email, code });
    // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────

    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setIsLoading(true);
    setError('');

    // ─── INTEGRATION BACKEND ──────────────────────────────────────────
    // await api.post('/auth/password/reset', { email, code, newPassword });
    // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────

    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setStep('success');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </button>

      {step === 'email' && (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Mot de passe oublié</h2>
            <p className="text-sm text-gray-500">
              Saisissez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Envoi...' : 'Envoyer le lien'}
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Code de vérification</h2>
            <p className="text-sm text-gray-500">
              Saisissez le code envoyé à {email}
            </p>
          </div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Vérification...' : 'Vérifier'}
          </Button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Nouveau mot de passe</h2>
          </div>

          {error && <Alert title = " Erreur de mot de passe " variant="destructive" 
                message={error}
          />}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmer</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Mise à jour...' : 'Réinitialiser'}
          </Button>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-xl font-bold">Mot de passe réinitialisé !</h2>
          <p className="text-sm text-gray-500">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Se connecter
          </Button>
        </div>
      )}
    </div>
  );
}