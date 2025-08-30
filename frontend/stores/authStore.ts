import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  profile?: any;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Getters
  hasRole: (role: 'ADMIN' | 'EDITOR' | 'USER') => boolean;
  canEdit: () => boolean;
  canAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user 
        }),

      setTokens: (token, refreshToken) => 
        set({ 
          token, 
          refreshToken, 
          isAuthenticated: !!token 
        }),

      setLoading: (isLoading) => 
        set({ isLoading }),

      login: (user, token, refreshToken) => 
        set({ 
          user, 
          token, 
          refreshToken, 
          isAuthenticated: true,
          isLoading: false
        }),

      logout: () => 
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false,
          isLoading: false 
        }),

      updateUser: (updates) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, ...updates } : null 
        })),

      // Role-based access helpers
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        const roleHierarchy = { 'ADMIN': 3, 'EDITOR': 2, 'USER': 1 };
        return roleHierarchy[user.role] >= roleHierarchy[role];
      },

      canEdit: () => {
        const { hasRole } = get();
        return hasRole('EDITOR');
      },

      canAdmin: () => {
        const { hasRole } = get();
        return hasRole('ADMIN');
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);