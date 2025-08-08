import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Organization {
  id: number;
  center: string;
  team?: string;
  group_name?: string;
  level: number;
  parent_id?: number;
}

interface AppState {
  // 조직 관련
  selectedOrganization: Organization | null;
  organizations: Organization[];
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  
  // 날짜 필터
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // Actions
  setSelectedOrganization: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setDateRange: (start: Date, end: Date) => void;
}

export const useStore = create<AppState>()(
  immer((set) => ({
    // 초기 상태
    selectedOrganization: null,
    organizations: [],
    isLoading: false,
    error: null,
    sidebarOpen: true,
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    },
    
    // Actions
    setSelectedOrganization: (org) => set((state) => {
      state.selectedOrganization = org;
    }),
    
    setOrganizations: (orgs) => set((state) => {
      state.organizations = orgs;
    }),
    
    setLoading: (loading) => set((state) => {
      state.isLoading = loading;
    }),
    
    setError: (error) => set((state) => {
      state.error = error;
    }),
    
    toggleSidebar: () => set((state) => {
      state.sidebarOpen = !state.sidebarOpen;
    }),
    
    setDateRange: (start, end) => set((state) => {
      state.dateRange = { start, end };
    }),
  }))
);