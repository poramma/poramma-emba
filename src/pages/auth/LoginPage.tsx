import { LoginForm } from '../../components/auth/LoginForm';
import { AuthShell } from '../../components/auth/AuthShell';

export function LoginPage() {
  return (
    <AuthShell title="Connexion" subtitle="Identifiez-vous pour accéder à votre espace de travail.">
      <LoginForm />
    </AuthShell>
  );
}

export default LoginPage;
