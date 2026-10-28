import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../AuthContext';
import type { AdminUser } from '../lib/types';
import { TextInput } from '../components/ui';
import { AuthShell } from './Login';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/forgot', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset your password">
      {sent ? (
        <div className="mt-6 space-y-4">
          <p role="status" className="rounded-2xl bg-card p-4 text-navy">
            If an account exists for <b>{email}</b>, we’ve emailed a link to choose a new password. The link works for 1 hour.
          </p>
          <Link to="/admin/login" className="font-semibold text-primary">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <p className="text-muted">Enter your email and we’ll send you a reset link.</p>
          <TextInput label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className="text-center text-sm">
            <Link to="/admin/login" className="font-semibold text-primary">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

/** Handles both "reset password" and "accept invitation" links. */
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const isInvite = params.get('invite') === '1';
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    setError('');
    try {
      const user = await api<AdminUser>('/auth/reset', { method: 'POST', body: { token, password, ...(isInvite && name ? { name } : {}) } });
      setUser(user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Link not valid">
        <p className="mt-4 text-muted">This link is missing information. Please request a new one.</p>
        <Link to="/admin/forgot-password" className="mt-6 inline-block font-semibold text-primary">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={isInvite ? 'Welcome! Set up your account' : 'Choose a new password'}>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {isInvite && <TextInput label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        <TextInput label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextInput label="Type it again" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={busy}>
          {busy ? 'Saving…' : isInvite ? 'Create my account' : 'Save new password'}
        </Button>
      </form>
    </AuthShell>
  );
}
