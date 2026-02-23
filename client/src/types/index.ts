export type UserRole = 'client' | 'coach';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface Workout {
  id: number;
  title: string;
  notes: string;
  scheduled_for: string;
}

export interface DashboardData {
  workouts: Workout[];
  weights: Array<{ id: number; weight: number; logged_at: string }>;
  meals: Array<{ id: number; meal_name: string; calories: number; source: string; logged_at: string }>;
  subscription: { tier: 'basic' | 'pro' | 'elite'; status: 'active' | 'paused' | 'cancelled' };
}
