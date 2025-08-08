import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface TagData {
  id: number;
  employee_id: string;
  tag_code: string;
  timestamp: string;
  gate_name?: string;
  direction?: 'IN' | 'OUT';
  activity_state?: string;
  confidence?: number;
}

interface ProcessedTagData extends TagData {
  duration?: number; // Duration until next tag in minutes
  isAnomalous?: boolean;
  anomalyType?: string;
}

interface TagStore {
  // Raw tag data
  tagData: TagData[];
  
  // Processed tag data with activity states
  processedData: ProcessedTagData[];
  
  // Filter state
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    employeeIds: string[];
    tagCodes: string[];
    activityStates: string[];
    anomaliesOnly: boolean;
  };
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // Loading states
  isLoading: boolean;
  isProcessing: boolean;
  
  // Actions
  setTagData: (data: TagData[]) => void;
  setProcessedData: (data: ProcessedTagData[]) => void;
  
  setDateRange: (start: string, end: string) => void;
  setEmployeeFilter: (ids: string[]) => void;
  setTagCodeFilter: (codes: string[]) => void;
  setActivityStateFilter: (states: string[]) => void;
  setAnomaliesOnly: (anomaliesOnly: boolean) => void;
  clearFilters: () => void;
  
  setPagination: (page: number, pageSize: number, total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  
  // Computed getters
  getFilteredData: () => ProcessedTagData[];
  getEmployeeData: (employeeId: string) => ProcessedTagData[];
  getDateData: (date: string) => ProcessedTagData[];
}

export const useTagStore = create<TagStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      tagData: [],
      processedData: [],
      
      filters: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        employeeIds: [],
        tagCodes: [],
        activityStates: [],
        anomaliesOnly: false,
      },
      
      pagination: {
        page: 1,
        pageSize: 50,
        total: 0,
      },
      
      isLoading: false,
      isProcessing: false,
      
      // Actions
      setTagData: (data) =>
        set((state) => {
          state.tagData = data;
        }),
      
      setProcessedData: (data) =>
        set((state) => {
          state.processedData = data;
          state.pagination.total = data.length;
        }),
      
      setDateRange: (start, end) =>
        set((state) => {
          state.filters.dateRange.start = start;
          state.filters.dateRange.end = end;
        }),
      
      setEmployeeFilter: (ids) =>
        set((state) => {
          state.filters.employeeIds = ids;
        }),
      
      setTagCodeFilter: (codes) =>
        set((state) => {
          state.filters.tagCodes = codes;
        }),
      
      setActivityStateFilter: (states) =>
        set((state) => {
          state.filters.activityStates = states;
        }),
      
      setAnomaliesOnly: (anomaliesOnly) =>
        set((state) => {
          state.filters.anomaliesOnly = anomaliesOnly;
        }),
      
      clearFilters: () =>
        set((state) => {
          state.filters = {
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0],
            },
            employeeIds: [],
            tagCodes: [],
            activityStates: [],
            anomaliesOnly: false,
          };
        }),
      
      setPagination: (page, pageSize, total) =>
        set((state) => {
          state.pagination.page = page;
          state.pagination.pageSize = pageSize;
          state.pagination.total = total;
        }),
      
      nextPage: () =>
        set((state) => {
          const maxPage = Math.ceil(state.pagination.total / state.pagination.pageSize);
          if (state.pagination.page < maxPage) {
            state.pagination.page += 1;
          }
        }),
      
      previousPage: () =>
        set((state) => {
          if (state.pagination.page > 1) {
            state.pagination.page -= 1;
          }
        }),
      
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),
      
      setProcessing: (processing) =>
        set((state) => {
          state.isProcessing = processing;
        }),
      
      // Computed getters
      getFilteredData: () => {
        const state = get();
        let filtered = [...state.processedData];
        
        // Apply date range filter
        filtered = filtered.filter((item) => {
          const itemDate = item.timestamp.split('T')[0];
          return itemDate >= state.filters.dateRange.start && itemDate <= state.filters.dateRange.end;
        });
        
        // Apply employee filter
        if (state.filters.employeeIds.length > 0) {
          filtered = filtered.filter((item) =>
            state.filters.employeeIds.includes(item.employee_id)
          );
        }
        
        // Apply tag code filter
        if (state.filters.tagCodes.length > 0) {
          filtered = filtered.filter((item) =>
            state.filters.tagCodes.includes(item.tag_code)
          );
        }
        
        // Apply activity state filter
        if (state.filters.activityStates.length > 0) {
          filtered = filtered.filter((item) =>
            item.activity_state && state.filters.activityStates.includes(item.activity_state)
          );
        }
        
        // Apply anomalies only filter
        if (state.filters.anomaliesOnly) {
          filtered = filtered.filter((item) => item.isAnomalous);
        }
        
        // Apply pagination
        const start = (state.pagination.page - 1) * state.pagination.pageSize;
        const end = start + state.pagination.pageSize;
        
        return filtered.slice(start, end);
      },
      
      getEmployeeData: (employeeId) => {
        const state = get();
        return state.processedData.filter((item) => item.employee_id === employeeId);
      },
      
      getDateData: (date) => {
        const state = get();
        return state.processedData.filter((item) => item.timestamp.startsWith(date));
      },
    }))
  )
);