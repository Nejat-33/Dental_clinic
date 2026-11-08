'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { clinicToday, formatClinicDateTime } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SlotPicker } from '@/components/admin/appointments/appointment-slot-picker';

type Props = {
  appointmentId: string;
  currentDate: string;
  onClose: () => void;
};

export function AppointmentRescheduleModal({ appointmentId, currentDate, onClose }: Props) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(clinicToday());
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);

  const reschedule = useMutation({
    mutationFn: () =>
      api(`/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          appointmentDate: slot,
          reason: reason.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Appointment rescheduled');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not reschedule the appointment'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!slot || reschedule.isPending) return;
    reschedule.mutate();
  }

  function changeDate(value: string) {
    setDate(value);
    setSlot('');
  }

  return (
    <Modal open onClose={onClose} title="Reschedule appointment">
      <form onSubmit={submit} noValidate className="space-y-6">
        <p className="text-sm text-slate-500">
          Currently scheduled for <span className="font-medium text-slate-700">{formatClinicDateTime(currentDate)}</span>
        </p>

        <Field label="New date" htmlFor="rs-date">
          <input
            id="rs-date"
            type="date"
            className={inputClass}
            value={date}
            min={clinicToday()}
            onChange={(e) => changeDate(e.target.value)}
          />
        </Field>

        <SlotPicker
          date={date}
          value={slot}
          onChange={setSlot}
          error={attempted && !slot ? 'Choose an available time' : undefined}
        />

        <Field label="Reason" htmlFor="rs-reason" optional>
          <textarea
            id="rs-reason"
            className={inputClass}
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose} disabled={reschedule.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={reschedule.isPending}>
            {reschedule.isPending ? 'Saving...' : 'Reschedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
