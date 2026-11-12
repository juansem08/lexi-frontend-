import React, { useEffect } from 'react';
import { Sprout } from 'lucide-react';

interface Props {
  message: string | null;
  onDone: () => void;
}

/** Aviso tranquilo: sin sonido, sin confeti; un brillo suave si el movimiento está permitido. */
export const CalmToast: React.FC<Props> = ({ message, onDone }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-8"
    >
      {message && (
        <div className="animate-soft-glow flex items-center gap-3 rounded-2xl border border-moss bg-moss-soft px-5 py-3 text-ink">
          <Sprout className="h-5 w-5 text-moss" aria-hidden />
          <span className="font-semibold">{message}</span>
        </div>
      )}
    </div>
  );
};
