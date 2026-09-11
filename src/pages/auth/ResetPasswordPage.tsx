import { PasswordReset } from '../../components/auth/PasswordReset';
import { Building2 } from 'lucide-react';

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Poramma</h1>
          </div>
          <PasswordReset />
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;