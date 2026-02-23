import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Notifications } from './components/Notifications';
import { AuthPage } from './features/auth/AuthPage';
import { ClientDashboard } from './features/client/ClientDashboard';
import { CoachDashboard } from './features/coach/CoachDashboard';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function App() {
  const { user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen p-4 md:p-8">
        <Header />
        {!user ? <AuthPage /> : user.role === 'client' ? <ClientDashboard /> : <CoachDashboard />}
      </div>
      <Notifications />
    </QueryClientProvider>
  );
}

export default App;
