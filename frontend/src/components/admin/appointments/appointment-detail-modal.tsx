'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Mail, MessageSquare, Phone, Stethoscope, UserRound } from 'lucide-react';
import { adminDoctorsQuery, appointmentDetailQuery } from '@/lib/admin-queries';
import { useAppointmentMutations } from '@/lib/appointment-mutations';
import { formatClinicDateTime } from '@/lib/dates';
import type { AppointmentStatus } from '@/types/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/field';
import { ErrorBox, ListSkeleton } from '@/components/admin/page-states';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { AssignDoctorModal } from '@/components/admin/appointments/assign-doctor-modal';

type Props = {
  appointmentId: string | null;
  onClose: () => void;
};

export function AppointmentDetailModal({ appointmentId, onClose }: Props) {
  return (
    <Modal open={appointmentId !== null} onClose={onClose} title="Appointment details">
      {appointmentId && <AppointmentDetailBody id={appointmentId} />}
    </Modal>
  );
}

type PendingAction = 'CANCELLED' | 'NO_SHOW' | null;

function AppointmentDetailBody({ id }: { id: string }) {
  const detail = useQuery(appointmentDetailQuery(id));
  const doctors = useQuery(adminDoctorsQuery);
  const { updateStatus, checkIn, assignDoctor } = useAppointmentMutations();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);

  if (detail.isLoading) return <ListSkeleton rows={2} />;
  if (detail.isError) {
    return <ErrorBox message="Could not load this appointment." onRetry={() => detail.refetch()} />;
  }

  const a = detail.data?.appointment;
  if (!a) return <ErrorBox message="Appointment not found." onRetry={() => detail.refetch()} />;

  const busy = updateStatus.isPending || checkIn.isPending || assignDoctor.isPending;
  const appointmentId = a.id;
  const hasStarted = new Date(a.appointmentDate).getTime() <= Date.now();
  const canAssign = a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN';

  function closeConfirm() {
    setPendingAction(null);
    setReason('');
  }

  function confirmPending() {
    if (!pendingAction) return;
    updateStatus.mutate(
      { id: appointmentId, status: pendingAction, reason: reason.trim() },
      { onSuccess: closeConfirm },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{a.patientName}</p>
          <p className="text-sm text-slate-500">{a.service.name}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem icon={Phone} label="Phone">
          <a href={`tel:${a.phone}`} className="hover:text-brand-700">{a.phone}</a>
        </DetailItem>
        <DetailItem icon={Mail} label="Email">
          {a.email ? <a href={`mailto:${a.email}`} className="break-all hover:text-brand-700">{a.email}</a> : 'Not provided'}
        </DetailItem>
        <DetailItem icon={Calendar} label="Scheduled">{formatClinicDateTime(a.appointmentDate)}</DetailItem>
        <DetailItem icon={Calendar} label="Booked on">{formatClinicDateTime(a.createdAt)}</DetailItem>
        <DetailItem icon={Stethoscope} label="Service">{a.service.name}</DetailItem>
        <DetailItem icon={UserRound} label="Assigned doctor">
          {a.doctor ? `${a.doctor.name} (${a.doctor.specialization})` : 'Unassigned'}
        </DetailItem>
      </dl>

      {a.message && (
        <div className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p>{a.message}</p>
        </div>
      )}

      <ActionBar
        status={a.status}
        canMarkNoShow={a.status === 'CONFIRMED' && hasStarted}
        canAssign={canAssign}
        busy={busy}
        checkingIn={checkIn.isPending}
        onConfirm={() => updateStatus.mutate({ id: a.id, status: 'CONFIRMED' })}
        onCheckIn={() => checkIn.mutate(a.id)}
        onAssign={() => setAssignOpen(true)}
        onCancel={() => setPendingAction('CANCELLED')}
        onNoShow={() => setPendingAction('NO_SHOW')}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction === 'NO_SHOW' ? 'Mark as no-show?' : 'Cancel this appointment?'}
        description={
          pendingAction === 'NO_SHOW'
            ? `This records that ${a.patientName} did not attend.`
            : `This cancels ${a.patientName}'s appointment. The time slot becomes available again.`
        }
        confirmLabel={pendingAction === 'NO_SHOW' ? 'Mark no-show' : 'Cancel appointment'}
        destructive
        busy={updateStatus.isPending}
        onConfirm={confirmPending}
        onClose={closeConfirm}
      >
        <label htmlFor="status-reason" className="mb-1.5 block text-sm font-medium text-slate-800">
          Reason <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="status-reason"
          value={reason}
          maxLength={500}
          rows={3}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
      </ConfirmDialog>

      <AssignDoctorModal
        open={assignOpen}
        patientName={a.patientName}
        currentDoctorId={a.doctor?.id ?? null}
        doctors={doctors.data ?? []}
        busy={assignDoctor.isPending}
        onClose={() => setAssignOpen(false)}
        onAssign={(doctorId) =>
          assignDoctor.mutate({ id: a.id, doctorId }, { onSuccess: () => setAssignOpen(false) })
        }
      />
    </div>
  );
}

type ActionBarProps = {
  status: AppointmentStatus;
  canMarkNoShow: boolean;
  canAssign: boolean;
  busy: boolean;
  checkingIn: boolean;
  onConfirm: () => void;
  onCheckIn: () => void;
  onAssign: () => void;
  onCancel: () => void;
  onNoShow: () => void;
};

function ActionBar({
  status, canMarkNoShow, canAssign, busy, checkingIn, onConfirm, onCheckIn, onAssign, onCancel, onNoShow,
}: ActionBarProps) {
  const isOpenStatus = status === 'PENDING' || status === 'CONFIRMED';

  return (
    <div className="border-t border-slate-100 pt-6">
      <div className="flex flex-wrap gap-2">
        {status === 'PENDING' && <Button disabled={busy} onClick={onConfirm}>Confirm</Button>}
        {status === 'CONFIRMED' && <Button disabled={busy} onClick={onCheckIn}>{checkingIn ? 'Checking in...' : 'Check in patient'}</Button>}
        {canAssign && <Button variant="outline" disabled={busy} onClick={onAssign}>Assign doctor</Button>}
        {canMarkNoShow && <Button variant="outline" disabled={busy} onClick={onNoShow}>Mark no-show</Button>}
        {isOpenStatus && (
          <Button variant="outline" disabled={busy} onClick={onCancel} className="text-red-700 hover:bg-red-50">
            Cancel appointment
          </Button>
        )}
      </div>
      {status === 'CHECKED_IN' && (
        <p className="mt-3 text-sm text-slate-500">The patient is in the clinic. Completing the visit is recorded from the patient&apos;s visit record.</p>
      )}
      {(status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') && (
        <p className="mt-3 text-sm text-slate-500">This appointment is closed and has no further actions.</p>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon, label, children,
}: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="size-4" /> {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}
