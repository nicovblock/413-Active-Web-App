import { get, set } from 'idb-keyval';
import type { DashboardData } from '../types/index';

const DASHBOARD_KEY = 'dashboard-cache';

export const cacheDashboard = async (data: DashboardData): Promise<void> => {
  await set(DASHBOARD_KEY, data);
};

export const getCachedDashboard = async (): Promise<DashboardData | null> => {
  const data = await get<DashboardData>(DASHBOARD_KEY);
  return data ?? null;
};
