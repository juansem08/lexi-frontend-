import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg';
}

/** Diálogo modal nativo: gestiona foco, Escape y fondo inerte. */
export const Modal: React.FC<Props> = ({ open, onClose, title, description, children, width = 'md' }) => {
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
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={`no-print m-auto w-[calc(100%-2rem)] rounded-[20px] border border-line bg-surface p-0 text-ink backdrop:bg-black/50 ${
        width === 'lg' ? 'max-w-2xl' : 'max-w-lg'
      }`}
    >
      {open && (
        <div className="max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-title" className="text-2xl font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-ink-soft">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 -mt-1 rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
};
