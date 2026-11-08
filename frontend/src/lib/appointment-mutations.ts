import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type StatusChange = 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: StatusChange; reason?: string }) =>
      api(`/appointments/${vars.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: vars.status, reason: vars.reason || undefined }),
      }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === 'CONFIRMED' ? 'Appointment confirmed' :
        vars.status === 'CANCELLED' ? 'Appointment cancelled' : 'Marked as no-show',
      );
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const checkIn = useMutation({
    mutationFn: (id: string) =>
      api(`/appointments/${id}/check-in`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      toast.success('Patient checked in');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const assignDoctor = useMutation({
    mutationFn: (vars: { id: string; doctorId: string }) =>
      api(`/appointments/${vars.id}/assign-doctor`, {
        method: 'PATCH',
        body: JSON.stringify({ doctorId: vars.doctorId }),
      }),
    onSuccess: () => {
      toast.success('Doctor assigned');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return { updateStatus, checkIn, assignDoctor };
}
