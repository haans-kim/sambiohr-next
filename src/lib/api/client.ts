// API Client for frontend-backend communication

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient('/api');

// Export specific API methods
export const api = {
  // Organizations
  organizations: {
    list: (params?: { level?: number; parent_id?: number }) =>
      apiClient.get('/organizations', params),
    get: (id: number) => apiClient.get(`/organizations/${id}`),
    create: (data: any) => apiClient.post('/organizations', data),
    update: (id: number, data: any) => apiClient.put(`/organizations/${id}`, data),
    delete: (id: number) => apiClient.delete(`/organizations/${id}`),
    summary: (id: number, params?: { date?: string; period?: string }) =>
      apiClient.get(`/organizations/${id}/summary`, params),
  },

  // Individuals
  individuals: {
    list: (params?: { center?: string; team?: string; group?: string }) =>
      apiClient.get('/individuals', params),
    get: (employeeId: string) => apiClient.get(`/individuals/${employeeId}`),
    create: (data: any) => apiClient.post('/individuals', data),
    update: (employeeId: string, data: any) => apiClient.put(`/individuals/${employeeId}`, data),
    delete: (employeeId: string) => apiClient.delete(`/individuals/${employeeId}`),
    daily: (employeeId: string, date: string) =>
      apiClient.get(`/individuals/${employeeId}/daily`, { date }),
    monthly: (employeeId: string, year: number, month: number) =>
      apiClient.get(`/individuals/${employeeId}/monthly`, { year, month }),
  },

  // Tag Data
  tags: {
    list: (params?: { 
      employee_id?: string; 
      date?: string; 
      start_date?: string; 
      end_date?: string;
      tag_codes?: string[];
    }) => apiClient.get('/tags', params),
    create: (data: any) => apiClient.post('/tags', data),
    process: (data: any) => apiClient.post('/tags/process', data),
    bulkUpload: (data: any) => apiClient.post('/tags/bulk', data),
  },

  // Anomalies
  anomalies: {
    detect: (params: {
      employee_id?: string;
      date?: string;
      start_date?: string;
      end_date?: string;
    }) => apiClient.post('/anomalies/detect', params),
    list: (params?: {
      employee_id?: string;
      date?: string;
      type?: string;
      severity?: string;
    }) => apiClient.get('/anomalies', params),
    get: (id: number) => apiClient.get(`/anomalies/${id}`),
    resolve: (id: number, resolution: string) =>
      apiClient.patch(`/anomalies/${id}/resolve`, { resolution }),
  },

  // File Upload
  upload: {
    excel: async (file: File, type: 'tags' | 'employees' | 'meals' | 'equipment') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      return response.json();
    },
    status: (uploadId: string) => apiClient.get(`/upload/status/${uploadId}`),
  },

  // Analytics
  analytics: {
    organizationTrends: (orgId: number, period: string = '30d') =>
      apiClient.get(`/analytics/organizations/${orgId}/trends`, { period }),
    employeeMetrics: (employeeId: string, period: string = '30d') =>
      apiClient.get(`/analytics/employees/${employeeId}/metrics`, { period }),
    systemOverview: () => apiClient.get('/analytics/overview'),
    anomalyStatistics: (params?: { period?: string; type?: string }) =>
      apiClient.get('/analytics/anomalies/stats', params),
  },
};

export default apiClient;