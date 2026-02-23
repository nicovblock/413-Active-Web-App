import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['client', 'coach'])
});

type FormData = z.infer<typeof schema>;

export const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'client' }
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register', values);
      }
      const { data } = await api.post('/auth/login', { email: values.email, password: values.password });
      setAuth(data.user, data.token);
    } catch (err) {
      setError('Authentication failed. Please verify your input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-12 max-w-md">
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">{isRegister ? 'Create account' : 'Sign in'}</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <input className="input" aria-label="Email" placeholder="Email" {...form.register('email')} />
          <input className="input" type="password" aria-label="Password" placeholder="Password" {...form.register('password')} />
          <select className="input" aria-label="Role" {...form.register('role')}>
            <option value="client">Client</option>
            <option value="coach">Coach</option>
          </select>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Loading...' : isRegister ? 'Register + Login' : 'Login'}
          </button>
        </form>
        <button className="mt-3 text-sm underline" onClick={() => setIsRegister((v) => !v)}>
          {isRegister ? 'Already have an account?' : 'Need an account? Register'}
        </button>
      </section>
    </main>
  );
};
