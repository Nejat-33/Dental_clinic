'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { clinicToday } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SlotPicker } from '@/components/admin/appointments/appointment-slot-picker';
import type { AdminDoctor, AdminService } from '@/types/api';

type Props = {
  services: AdminService[];
  doctors: AdminDoctor[];
  onClose: () => void;
};

export function AppointmentCreateModal({ services, doctors, onClose }: Props) {
  const queryClient = useQueryClient();
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(clinicToday());
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [attempted, setAttempted] = useState(false);

  const eligibleDoctors = doctors.filter((d) => d.isActive && d.isVerified);

  const errors = {
    patientName: patientName.trim().length < 2 ? 'Enter the patient name' : undefined,
    phone: phone.trim() ? undefined : 'Enter a phone number',
    serviceId: serviceId ? undefined : 'Choose a service',
    slot: slot ? undefined : 'Choose an available time',
  };
  const invalid = Object.values(errors).some(Boolean);
  const shownError = (key: keyof typeof errors) => (attempted ? errors[key] : undefined);

  const create = useMutation({
    mutationFn: () =>
      api('/appointments/admin', {
        method: 'POST',
        body: JSON.stringify({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          serviceId,
          doctorId: doctorId || undefined,
          appointmentDate: slot,
          message: note.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Appointment created');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not create the appointment'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (invalid || create.isPending) return;
    create.mutate();
  }

  function changeDate(value: string) {
    setDate(value);
    setSlot('');
  }

  return (
    <Modal open onClose={onClose} title="New appointment">
      <form onSubmit={submit} noValidate className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient name" htmlFor="ca-name" error={shownError('patientName')}>
            <input
              id="ca-name"
              className={inputClass}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Phone" htmlFor="ca-phone" error={shownError('phone')}>
            <input
              id="ca-phone"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXX"
            />
          </Field>
          <Field label="Email" htmlFor="ca-email" optional>
            <input
              id="ca-email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Service" htmlFor="ca-service" error={shownError('serviceId')}>
            <select
              id="ca-service"
              className={inputClass}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Select a service</option>
              {services
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Doctor" htmlFor="ca-doctor" optional>
            <select
              id="ca-doctor"
              className={inputClass}
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Assign later</option>
              {eligibleDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.specialization ? ` (${d.specialization})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" htmlFor="ca-date">
            <input
              id="ca-date"
              type="date"
              className={inputClass}
              value={date}
              min={clinicToday()}
              onChange={(e) => changeDate(e.target.value)}
            />
          </Field>
        </section>

        <SlotPicker date={date} value={slot} onChange={setSlot} error={shownError('slot')} />

        <Field label="Notes" htmlFor="ca-note" optional>
          <textarea
            id="ca-note"
            className={inputClass}
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={create.isPending}>
            {create.isPending ? 'Creating...' : 'Create appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
