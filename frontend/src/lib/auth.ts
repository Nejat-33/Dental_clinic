import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUser } from '@/types/api';

export function useAdmin() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<AdminUser>('/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  });
}