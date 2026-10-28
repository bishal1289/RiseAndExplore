import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../AuthContext';
import { TextInput } from '../components/ui';

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-section bg-white p-8 shadow-float sm:p-10">
        <img src="/logo.svg" alt="RISE" className="h-10 w-auto" />
        <h1 className="mt-8 font-serif text-3xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from ?? '/admin'} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in to the admin">
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-center text-sm">
          <Link to="/admin/forgot-password" className="font-semibold text-primary underline-offset-4 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
