import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useNotificationStore } from '../../store/notificationStore';

interface AssignForm {
  clientId: number;
  title: string;
  notes: string;
  scheduledFor: string;
}

export const CoachDashboard = () => {
  const { push } = useNotificationStore();
  const form = useForm<AssignForm>();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/coach/clients')).data as Array<{ id: number; email: string }>
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: AssignForm) =>
      api.post('/coach/workouts', {
        ...payload,
        clientId: Number(payload.clientId),
        scheduledFor: new Date(payload.scheduledFor).toISOString()
      }),
    onSuccess: () => push('Workout assigned successfully')
  });

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="card">
        <h2 className="mb-3 text-lg font-semibold">Assign workout</h2>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => assignMutation.mutate(v))}
        >
          <select className="input" {...form.register('clientId', { required: true })} aria-label="Select client">
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.email}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Workout title" {...form.register('title', { required: true })} />
          <textarea className="input" placeholder="Notes" {...form.register('notes')} />
          <input className="input" type="datetime-local" {...form.register('scheduledFor', { required: true })} />
          <button className="btn-primary" disabled={assignMutation.isPending || isLoading}>
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2 className="mb-3 text-lg font-semibold">Client roster</h2>
        {isLoading ? (
          <p>Loading clients…</p>
        ) : clients.length === 0 ? (
          <p>No clients registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.id} className="rounded-lg border p-2 dark:border-slate-700">
                {c.email}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
