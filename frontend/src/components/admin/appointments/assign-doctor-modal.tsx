'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { AdminDoctor } from '@/types/api';

type Props = {
  open: boolean;
  patientName: string;
  currentDoctorId: string | null;
  doctors: AdminDoctor[];
  busy: boolean;
  onAssign: (doctorId: string) => void;
  onClose: () => void;
};

export function AssignDoctorModal(props: Props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Assign doctor">
      <DoctorPicker {...props} />
    </Modal>
  );
}

function DoctorPicker({ patientName, currentDoctorId, doctors, busy, onAssign, onClose }: Props) {
  const eligible = doctors.filter((d) => d.isActive && d.isVerified);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <p className="text-sm text-slate-600">
        Choose the doctor who will see <span className="font-semibold text-slate-900">{patientName}</span>.
        Only active, verified doctors can be assigned.
      </p>

      {eligible.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          No active, verified doctors are available.
        </p>
      ) : (
        <ul className="mt-6 max-h-80 space-y-2 overflow-y-auto pr-1" role="listbox" aria-label="Doctors">
          {eligible.map((d) => {
            const isSelected = selected === d.id;
            const isCurrent = currentDoctorId === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={busy || isCurrent}
                  onClick={() => setSelected(d.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition',
                    isSelected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                    isCurrent && 'cursor-default opacity-70',
                  )}
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{d.name}</span>
                    <span className="block text-sm text-slate-500">{d.specialization}</span>
                  </span>
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-slate-500">Current</span>
                  ) : isSelected ? (
                    <Check className="size-5 shrink-0 text-brand-700" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={() => selected && onAssign(selected)} disabled={busy || !selected}>
          {busy ? 'Assigning...' : 'Assign doctor'}
        </Button>
      </div>
    </div>
  );
}
