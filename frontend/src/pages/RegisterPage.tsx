import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardBody } from '../components/ui/Card';

// Odbicie reguł z backendu — walidacja po stronie klienta dla lepszego UX.
// Właściwą walidacją i tak pozostaje backend (Zod).
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Hasło musi mieć co najmniej 8 znaków';
  if (!/[a-z]/.test(pw)) return 'Hasło musi zawierać małą literę';
  if (!/[A-Z]/.test(pw)) return 'Hasło musi zawierać wielką literę';
  if (!/[0-9]/.test(pw)) return 'Hasło musi zawierać cyfrę';
  return null;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Nie udało się zarejestrować'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold">Rejestracja</h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Min. 8 znaków, mała i wielka litera oraz cyfra.
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Rejestracja…' : 'Załóż konto'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-400">
        Masz już konto?{' '}
        <Link to="/login" className="text-brand hover:underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
