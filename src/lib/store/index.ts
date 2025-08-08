import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // User preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  
  // Session data
  session: {
    user?: {
      id: string;
      name: string;
      role: string;
      permissions: string[];
    };
    organization?: {
      id: number;
      center: string;
      team?: string;
      group?: string;
    };
  };
  
  // UI state
  ui: {
    sidebarOpen: boolean;
    activeView: 'dashboard' | 'individuals' | 'organizations' | 'analysis';
    loading: {
      [key: string]: boolean;
    };
    errors: {
      [key: string]: string | null;
    };
  };
  
  // Actions
  setPreference: <K extends keyof AppState['preferences']>(
    key: K,
    value: AppState['preferences'][K]
  ) => void;
  
  setUser: (user: AppState['session']['user']) => void;
  clearUser: () => void;
  
  setOrganization: (org: AppState['session']['organization']) => void;
  clearOrganization: () => void;
  
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: AppState['ui']['activeView']) => void;
  
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  clearErrors: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    immer((set) => ({
      // Initial state
      preferences: {
        theme: 'light',
        language: 'ko',
        dateFormat: 'yyyy-MM-dd',
        timeFormat: '24h',
      },
      
      session: {
        user: undefined,
        organization: undefined,
      },
      
      ui: {
        sidebarOpen: true,
        activeView: 'dashboard',
        loading: {},
        errors: {},
      },
      
      // Actions
      setPreference: (key, value) =>
        set((state) => {
          state.preferences[key] = value;
        }),
      
      setUser: (user) =>
        set((state) => {
          state.session.user = user;
        }),
      
      clearUser: () =>
        set((state) => {
          state.session.user = undefined;
        }),
      
      setOrganization: (org) =>
        set((state) => {
          state.session.organization = org;
        }),
      
      clearOrganization: () =>
        set((state) => {
          state.session.organization = undefined;
        }),
      
      setSidebarOpen: (open) =>
        set((state) => {
          state.ui.sidebarOpen = open;
        }),
      
      setActiveView: (view) =>
        set((state) => {
          state.ui.activeView = view;
        }),
      
      setLoading: (key, loading) =>
        set((state) => {
          state.ui.loading[key] = loading;
        }),
      
      setError: (key, error) =>
        set((state) => {
          state.ui.errors[key] = error;
        }),
      
      clearErrors: () =>
        set((state) => {
          state.ui.errors = {};
        }),
    }))
  )
);