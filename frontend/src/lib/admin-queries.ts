import { api } from '@/lib/api';
import type { Appointment, Paginated } from '@/types/api';

type Params = { status?: string; date?: string; page?: number; limit?: number };

export function appointmentsQuery(params: Params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  return {
    queryKey: ['appointments', params] as const,
    queryFn: () => api<Paginated<Appointment>>(`/appointments?${qs}`),
  };
}