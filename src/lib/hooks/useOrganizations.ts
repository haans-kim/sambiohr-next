'use client';

import { useQuery } from '@tanstack/react-query';

interface Organization {
  id: number;
  center: string;
  team?: string;
  group_name?: string;
  level: number;
  parent_id?: number;
  total_employees?: number;
  avg_work_time?: number;
  avg_estimation_rate?: number;
  performance_score?: number;
}

export function useOrganizations(level: number = 1, parentId?: number) {
  return useQuery<Organization[]>({
    queryKey: ['organizations', level, parentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('level', level.toString());
      if (parentId) {
        params.append('parent_id', parentId.toString());
      }

      const response = await fetch('/api/organizations?' + params.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result = await response.json();
      return result.data || [];
    },
  });
}

export function useOrganization(id: number) {
  return useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const response = await fetch('/api/organizations/' + id);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}