import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  userRole: 'Admin' | 'TeamLead' | 'QCManager' | 'Agent' | 'Viewer' | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserRole: (role: 'Admin' | 'TeamLead' | 'QCManager' | 'Agent' | 'Viewer' | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userRole: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserRole: (role) => set({ userRole: role }),
  setLoading: (loading) => set({ loading }),
}));
