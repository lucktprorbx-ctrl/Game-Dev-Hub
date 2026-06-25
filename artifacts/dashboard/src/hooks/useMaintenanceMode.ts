import { useQuery } from '@tanstack/react-query';

export type MaintenanceStatus = {
  maintenanceMode: boolean;
  message: string | null;
  updatedAt: string;
};

export function useMaintenanceMode() {
  return useQuery<MaintenanceStatus>({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      const res = await fetch('/api/maintenance');
      if (!res.ok) throw new Error('Failed to fetch maintenance status');
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
