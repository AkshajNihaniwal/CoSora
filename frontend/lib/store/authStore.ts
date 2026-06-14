import { create } from 'zustand';

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'REVIEWER';
  domainScope: string[];
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
