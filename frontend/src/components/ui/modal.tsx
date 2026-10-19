'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode };

export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl p-0 shadow-2xl backdrop:bg-slate-900/50"
    >
      {/* Children only render while open, so every open starts with a fresh form */}
      {open && (
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}