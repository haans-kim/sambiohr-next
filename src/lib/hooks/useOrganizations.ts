import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Organization {
  id: number;
  center: string;
  team?: string;
  group_name?: string;
  level: number;
  parent_id?: number;
}

async function fetchOrganizations(level?: number, parentId?: number) {
  const params = new URLSearchParams();
  if (level !== undefined) params.append('level', level.toString());
  if (parentId !== undefined) params.append('parentId', parentId.toString());
  
  const response = await fetch(`/api/organizations?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }
  
  const data = await response.json();
  return data.data as Organization[];
}

async function createOrganization(org: Omit<Organization, 'id'>) {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(org),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create organization');
  }
  
  const data = await response.json();
  return data.data;
}

export function useOrganizations(level?: number, parentId?: number) {
  return useQuery({
    queryKey: ['organizations', level, parentId],
    queryFn: () => fetchOrganizations(level, parentId),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}