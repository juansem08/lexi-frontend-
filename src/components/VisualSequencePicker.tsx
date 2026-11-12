import React from 'react';
import {
  Bird,
  Cloud,
  Fish,
  Flower2,
  Heart,
  Leaf,
  Moon,
  Music,
  Star,
  Sun,
  TreePine,
  Zap,
  Delete,
} from 'lucide-react';
import { cx } from './ui';

// Identificadores en minúsculas: la API valida /^[a-z0-9-]{1,30}$/.
export const VISUAL_ICONS = [
  { id: 'star', label: 'Estrella', Icon: Star },
  { id: 'moon', label: 'Luna', Icon: Moon },
  { id: 'leaf', label: 'Hoja', Icon: Leaf },
  { id: 'sun', label: 'Sol', Icon: Sun },
  { id: 'cloud', label: 'Nube', Icon: Cloud },
  { id: 'flower', label: 'Flor', Icon: Flower2 },
  { id: 'heart', label: 'Corazón', Icon: Heart },
  { id: 'bolt', label: 'Rayo', Icon: Zap },
  { id: 'music', label: 'Música', Icon: Music },
  { id: 'tree', label: 'Árbol', Icon: TreePine },
  { id: 'fish', label: 'Pez', Icon: Fish },
  { id: 'bird', label: 'Pájaro', Icon: Bird },
] as const;

export const MIN_SEQUENCE = 3;
export const MAX_SEQUENCE = 6;

export function iconLabel(id: string): string {
  return VISUAL_ICONS.find((i) => i.id === id)?.label ?? id;
}

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** Oculta los nombres en el rastro (útil al iniciar sesión). */
  concealTrail?: boolean;
}

export const VisualSequencePicker: React.FC<Props> = ({ value, onChange, concealTrail }) => {
  const add = (id: string) => {
    if (value.length < MAX_SEQUENCE) onChange([...value, id]);
  };

  return (
    <div>
      {/* Rastro de la secuencia: es un orden real, por eso va numerado. */}
      <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-line bg-bg p-2">
        {value.length === 0 ? (
          <span className="px-2 text-ink-soft">Toca los dibujos en el orden de tu clave.</span>
        ) : (
          value.map((id, i) => {
            const match = VISUAL_ICONS.find((v) => v.id === id);
            const Icon = match?.Icon ?? Star;
            return (
              <span
                key={`${id}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-ink"
              >
                <span className="text-sm font-bold text-ink-soft">{i + 1}</span>
                <Icon className="h-5 w-5" aria-hidden />
                {!concealTrail && <span className="text-sm">{match?.label}</span>}
              </span>
            );
          })
        )}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(value.slice(0, -1))}
            className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            <Delete className="h-4 w-4" aria-hidden />
            Borrar último
          </button>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink-soft" aria-live="polite">
        {value.length} de {MAX_SEQUENCE} dibujos (mínimo {MIN_SEQUENCE})
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {VISUAL_ICONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => add(id)}
            disabled={value.length >= MAX_SEQUENCE}
            className={cx(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-line bg-surface text-ink',
              'hover:border-accent disabled:opacity-40',
            )}
          >
            <Icon className="h-7 w-7" aria-hidden />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
