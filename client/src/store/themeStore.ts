import { create } from 'zustand';

type Theme = 'light' | 'dark';

const initialTheme = (localStorage.getItem('theme') as Theme | null) || 'light';
document.documentElement.classList.toggle('dark', initialTheme === 'dark');

export const useThemeStore = create<{ theme: Theme; toggleTheme: () => void }>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  }
}));
