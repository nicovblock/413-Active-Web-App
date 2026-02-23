import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

export const Header = () => {
  const { toggleTheme, theme } = useThemeStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <h1 className="text-xl font-semibold">413 Active Fitness Tracker</h1>
      <div className="flex items-center gap-3">
        <button className="btn" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {user && <span className="text-xs opacity-75">{user.email}</span>}
        {user && (
          <button className="btn-primary" onClick={logout} aria-label="Logout">
            Logout
          </button>
        )}
      </div>
    </header>
  );
};
