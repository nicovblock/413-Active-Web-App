export type UserRole = 'client' | 'coach';

export interface JwtPayload {
  userId: number;
  role: UserRole;
  email: string;
}
