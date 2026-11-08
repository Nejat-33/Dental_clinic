import { api } from '@/lib/api';
import type { AdminDoctor, AdminService, Appointment, AppointmentListResponse } from '@/types/api';

type AppointmentParams = {
  status?: string;
  date?: string;
  doctorId?: string;
  serviceId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function appointmentsQuery(params: AppointmentParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  });
  return {
    queryKey: ['appointments', 'list', params] as const,
    queryFn: () => api<AppointmentListResponse>(`/appointments?${qs}`),
  };
}

export function appointmentDetailQuery(id: string) {
  return {
    queryKey: ['appointments', 'detail', id] as const,
    queryFn: () => api<{ appointment: Appointment }>(`/appointments/${id}`),
  };
}

export const adminDoctorsQuery = {
  queryKey: ['doctors', 'admin'] as const,
  queryFn: () => api<AdminDoctor[]>('/doctors/all'),
};

export const adminServicesQuery = {
  queryKey: ['services', 'admin'] as const,
  queryFn: () => api<AdminService[]>('/services/all'),
};
