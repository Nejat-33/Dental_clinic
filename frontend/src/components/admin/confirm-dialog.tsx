'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
};

export function ConfirmDialog({
  open, title, description, confirmLabel, destructive, busy, onConfirm, onClose, children,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{description}</p>
      {children && <div className="mt-5">{children}</div>}
      <div className="mt-8 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Keep appointment
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy}
          className={cn(destructive && 'bg-red-600 shadow-sm hover:bg-red-700')}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
