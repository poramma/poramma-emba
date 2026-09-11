import { LoginForm } from '../../components/auth/LoginForm';
import { Building2 } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Poramma</h1>
            <p className="text-sm text-gray-500">
              Système de gestion consulaire — Ambassade du Mali
            </p>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Ambassade du Mali au Maroc
        </p>
      </div>
    </div>
  );
}


export default LoginPage;
