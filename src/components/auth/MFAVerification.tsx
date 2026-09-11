import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';

export function MFAVerification() {
  const navigate = useNavigate();
  const { verifyMFA, isLoading, error, clearError, user } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // ─── INTEGRATION BACKEND ──────────────────────────────────────────
    // api.post('/auth/mfa/send', { userId: user?.id });
    // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────
    
    // MOCK : simuler l'envoi du code
    console.log('[MOCK] Code MFA envoyé au numéro de l\'agent');
  }, [user]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) return;
    
    clearError();

    // ─── INTEGRATION BACKEND ──────────────────────────────────────────
    // const response = await api.post('/auth/mfa/verify', { code: fullCode });
    // if (response.data.valid) {
    //   setMfaVerified(true);
    // }
    // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────

    // MOCK
    const success = await verifyMFA(fullCode);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Vérification en deux étapes</h2>
        <p className="text-sm text-gray-500">
          Saisissez le code à 6 chiffres envoyé à votre appareil
        </p>
      </div>

      {error && (
        <Alert title="Erreur de Vérification" variant="destructive" message={error} />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-300 
                         focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                         dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || code.some(c => !c)}>
          {isLoading ? 'Vérification...' : 'Vérifier'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Pas reçu de code ?{' '}
          <button type="button" className="text-primary hover:underline">
            Renvoyer
          </button>
        </p>
      </form>
    </div>
  );
}