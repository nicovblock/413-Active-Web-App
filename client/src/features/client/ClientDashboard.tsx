import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { cacheDashboard, getCachedDashboard } from '../../lib/offlineCache';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import type { DashboardData } from '../../types';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', { autoConnect: false });

export const ClientDashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { push } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      try {
        const response = await api.get('/client/dashboard');
        await cacheDashboard(response.data);
        return response.data;
      } catch {
        const cached = await getCachedDashboard();
        if (!cached) throw new Error('No offline data');
        return cached;
      }
    }
  });

  useEffect(() => {
    if (!user) return;
    socket.auth = { userId: user.id, role: user.role };
    socket.connect();
    socket.on('workout:updated', () => {
      push('Workout updated by your coach');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    return () => {
      socket.off('workout:updated');
      socket.disconnect();
    };
  }, [queryClient, push, user]);

  const weightForm = useForm<{ weight: number }>();
  const mealForm = useForm<{ mealName: string; calories: number }>();
  const subForm = useForm<{ tier: 'basic' | 'pro' | 'elite'; status: 'active' | 'paused' | 'cancelled' }>({ defaultValues: { tier: 'basic', status: 'active' } });

  const addWeight = useMutation({
    mutationFn: (payload: { weight: number }) => api.post('/client/weights', { weight: Number(payload.weight), loggedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const addMeal = useMutation({
    mutationFn: (payload: { mealName: string; calories: number }) => api.post('/client/meals', { ...payload, calories: Number(payload.calories), loggedAt: new Date().toISOString(), source: 'myfitnesspal-sync' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const updateSub = useMutation({
    mutationFn: (payload: { tier: 'basic' | 'pro' | 'elite'; status: 'active' | 'paused' | 'cancelled' }) => api.put('/client/subscription', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  if (isLoading) return <p className="card">Loading dashboard…</p>;
  if (!data) return <p className="card">No data available.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Workout calendar</h2>
        {data.workouts.length === 0 ? <p>No assigned workouts yet.</p> : (
          <ul className="space-y-2">
            {data.workouts.map((w) => (
              <li key={w.id} className="rounded-xl border p-2 dark:border-slate-700">
                <p className="font-medium">{w.title}</p>
                <p className="text-sm opacity-70">{new Date(w.scheduled_for).toLocaleString()}</p>
                <p className="text-sm">{w.notes}</p>
              </li>
            ))}
          </ul>
        )}
        <a className="btn-primary mt-3 inline-block" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/client/export.csv`}>
          Export CSV
        </a>
      </section>

      <section className="space-y-4">
        <article className="card">
          <h3 className="mb-2 font-semibold">Weight progress</h3>
          <form onSubmit={weightForm.handleSubmit((v) => addWeight.mutate(v))} className="mb-2 flex gap-2">
            <input className="input" step="0.1" type="number" placeholder="Weight (lbs)" {...weightForm.register('weight', { required: true })} />
            <button className="btn-primary">Add</button>
          </form>
          <ul className="space-y-1 text-sm">
            {data.weights.slice(0, 5).map((w) => <li key={w.id}>{w.weight} lbs • {new Date(w.logged_at).toLocaleDateString()}</li>)}
          </ul>
        </article>

        <article className="card">
          <h3 className="mb-2 font-semibold">Meals (MyFitnessPal sync)</h3>
          <form onSubmit={mealForm.handleSubmit((v) => addMeal.mutate(v))} className="space-y-2">
            <input className="input" placeholder="Meal name" {...mealForm.register('mealName', { required: true })} />
            <input className="input" type="number" placeholder="Calories" {...mealForm.register('calories', { required: true })} />
            <button className="btn-primary">Log meal</button>
          </form>
        </article>

        <article className="card">
          <h3 className="mb-2 font-semibold">Subscription</h3>
          <form onSubmit={subForm.handleSubmit((v) => updateSub.mutate(v))} className="space-y-2">
            <select className="input" {...subForm.register('tier')}>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
            <select className="input" {...subForm.register('status')}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-primary">Update</button>
          </form>
        </article>
      </section>
    </div>
  );
};
