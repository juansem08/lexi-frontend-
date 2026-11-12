import React from 'react';
import { Check } from 'lucide-react';
import { FONT_STACKS, useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { PACING } from '../lib/reading';
import type {
  AccessibilityPreferences,
  ContrastMode,
  FontFamily,
  HighlightPacing,
  TtsVoicePersona,
} from '../types/api';
import { AccountPanel } from './AccountPanel';
import { Button, Notice, PageHeader, Section, Segmented, cx } from './ui';

const FONTS: Array<{ id: FontFamily; label: string; note: string }> = [
  { id: 'OPEN_DYSLEXIC', label: 'OpenDyslexic', note: 'Letras con base pesada que no se giran.' },
  { id: 'ATKINSON_HYPERLEGIBLE', label: 'Atkinson Hyperlegible', note: 'Letras parecidas fáciles de distinguir.' },
  { id: 'VERDANA', label: 'Verdana', note: 'Ancha y clara en pantalla.' },
  { id: 'ARIAL', label: 'Arial', note: 'Sencilla y conocida.' },
  { id: 'COMIC_SANS', label: 'Comic Sans', note: 'Formas redondas y amables.' },
];

// Muestras fijas: deben verse igual que cada modo aunque el tema actual sea otro.
const CONTRASTS: Array<{ id: ContrastMode; label: string; bg: string; fg: string; band: string }> = [
  { id: 'LIGHT', label: 'Claro', bg: '#fbfdfc', fg: '#1f2d3a', band: '#f6e7a8' },
  { id: 'PASTEL', label: 'Papel cálido', bg: '#fcf8ee', fg: '#3a3326', band: '#f3dfa0' },
  { id: 'DARK', label: 'Oscuro', bg: '#1b2530', fg: '#e4ebf0', band: '#4a4524' },
  { id: 'HIGH_CONTRAST', label: 'Alto contraste', bg: '#000000', fg: '#ffffff', band: '#3d3a00' },
];

const PERSONAS: Array<{ id: TtsVoicePersona; label: string; note: string }> = [
  { id: 'CHILD_FRIENDLY', label: 'Voz cercana', note: 'Cálida y pausada.' },
  { id: 'CALM_NARRATOR', label: 'Narración tranquila', note: 'Serena, para concentrarse.' },
  { id: 'NEURAL_FRIENDLY', label: 'Voz natural', note: 'Clara y fluida.' },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

const Slider: React.FC<{
  id: keyof AccessibilityPreferences;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  ends: [string, string];
  onChange: (v: number) => void;
}> = ({ id, label, value, min, max, step, format, ends, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={`pref-${id}`} className="font-semibold">
        {label}
      </label>
      <output htmlFor={`pref-${id}`} className="font-[Lexend] text-lg">
        {format(value)}
      </output>
    </div>
    <input
      id={`pref-${id}`}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(round2(parseFloat(e.target.value)))}
      className="mt-1 w-full"
    />
    <div className="flex justify-between text-sm text-ink-soft">
      <span>{ends[0]}</span>
      <span>{ends[1]}</span>
    </div>
  </div>
);

const Toggle: React.FC<{
  id: string;
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, note, checked, onChange }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line p-4">
    <span>
      <span className="block font-semibold">{label}</span>
      <span className="text-ink-soft">{note}</span>
    </span>
    <span className="relative mt-1 inline-flex shrink-0">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="h-7 w-12 rounded-full bg-line peer-checked:bg-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
      <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-surface transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

export const PreferencesPanel: React.FC = () => {
  const { preferences: p, updateLocalPref: set, isDirty, saveState, saveError, saveToAccount, resetToAccount } =
    useAccessibility();
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ajustes de lectura"
        lead={
          isAuthenticated
            ? 'Los cambios se ven al instante. Guárdalos para tenerlos en cualquier dispositivo.'
            : 'Los cambios se ven al instante y quedan en este navegador. Entra para guardarlos en tu cuenta.'
        }
      />

      {/* Vista previa con la regla de lectura, igual que en el lector */}
      <div className="reader-text overflow-hidden rounded-[20px] border border-line bg-surface py-4 text-[1.4rem]">
        <p className="px-6 py-1.5 opacity-35">Al principio, el texto parecía un bosque lleno de ramas.</p>
        <p className="bg-ruler px-6 py-1.5">
          Pero al mirar una línea a la vez, cada palabra encontró su lugar.
        </p>
        <p className="px-6 py-1.5 opacity-35">Y la lectura se volvió un paseo tranquilo.</p>
      </div>

      <Section title="Letra">
        <div role="radiogroup" aria-label="Tipo de letra" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FONTS.map((f) => {
            const on = p.preferredFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ preferredFont: f.id })}
                className={cx(
                  'rounded-2xl border-2 p-4 text-left',
                  on ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink-soft',
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-xl" style={{ fontFamily: FONT_STACKS[f.id] }}>
                    {f.label}
                  </span>
                  {on && <Check className="h-5 w-5 text-accent" aria-hidden />}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">{f.note}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <Slider
            id="letterSpacing"
            label="Espacio entre letras"
            value={p.letterSpacing}
            min={0}
            max={0.3}
            step={0.01}
            format={(v) => `${v.toFixed(2)} em`}
            ends={['Juntas', 'Separadas']}
            onChange={(v) => set({ letterSpacing: v })}
          />
          <Slider
            id="lineHeight"
            label="Espacio entre líneas"
            value={p.lineHeight}
            min={1}
            max={3}
            step={0.1}
            format={(v) => `${v.toFixed(1)}×`}
            ends={['Compacto', 'Amplio']}
            onChange={(v) => set({ lineHeight: v })}
          />
          <Slider
            id="lineFocusWindowSize"
            label="Oraciones iluminadas"
            value={p.lineFocusWindowSize}
            min={1}
            max={10}
            step={1}
            format={(v) => String(v)}
            ends={['1', '10']}
            onChange={(v) => set({ lineFocusWindowSize: Math.round(v) })}
          />
        </div>
      </Section>

      <Section title="Colores">
        <div role="radiogroup" aria-label="Modo de color" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CONTRASTS.map((c) => {
            const on = p.contrastMode === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ contrastMode: c.id })}
                className={cx('rounded-2xl border-2 p-2 text-left', on ? 'border-accent' : 'border-line hover:border-ink-soft')}
              >
                <span className="block overflow-hidden rounded-xl py-2" style={{ background: c.bg, color: c.fg }}>
                  <span className="block px-3 text-sm opacity-40">una línea antes</span>
                  <span className="block px-3 py-0.5 font-semibold" style={{ background: c.band }}>
                    Aa línea actual
                  </span>
                  <span className="block px-3 text-sm opacity-40">una línea después</span>
                </span>
                <span className="mt-2 flex items-center justify-between px-1 font-semibold">
                  {c.label}
                  {on && <Check className="h-5 w-5 text-accent" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Voz y ritmo">
        <div role="radiogroup" aria-label="Voz" className="grid gap-3 md:grid-cols-3">
          {PERSONAS.map((v) => {
            const on = p.ttsVoicePersona === v.id;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ ttsVoicePersona: v.id })}
                className={cx(
                  'rounded-2xl border-2 p-4 text-left',
                  on ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink-soft',
                )}
              >
                <span className="flex items-center justify-between font-semibold">
                  {v.label}
                  {on && <Check className="h-5 w-5 text-accent" aria-hidden />}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">{v.note}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Slider
            id="speechRate"
            label="Velocidad de la voz"
            value={p.speechRate}
            min={0.75}
            max={1.25}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            ends={['Más lenta', 'Más rápida']}
            onChange={(v) => set({ speechRate: v })}
          />
          <Slider
            id="speechPitch"
            label="Tono de la voz"
            value={p.speechPitch}
            min={0.75}
            max={1.5}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            ends={['Más grave', 'Más agudo']}
            onChange={(v) => set({ speechPitch: v })}
          />
        </div>

        <div className="mt-8">
          <p className="font-semibold">Ritmo de lectura</p>
          <p className="mb-2 text-ink-soft">
            Cambia el tiempo estimado y cuántas palabras tiene cada parte corta.
          </p>
          <Segmented<HighlightPacing>
            label="Ritmo de lectura"
            value={p.highlightPacing}
            onChange={(v) => set({ highlightPacing: v })}
            options={(['SLOW', 'BALANCED', 'FAST'] as const).map((id) => ({ id, label: PACING[id].label }))}
          />
        </div>
      </Section>

      <Section title="Comodidad">
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle
            id="pref-reduceMotion"
            label="Menos movimiento"
            note="Quita animaciones y desplazamientos suaves."
            checked={p.reduceMotion}
            onChange={(v) => set({ reduceMotion: v })}
          />
          <Toggle
            id="pref-soundEffects"
            label="Sonidos suaves"
            note="Queda guardado en tu perfil. Por ahora LexiLearn no reproduce sonidos al celebrar."
            checked={p.soundEffects}
            onChange={(v) => set({ soundEffects: v })}
          />
        </div>
      </Section>

      {isAuthenticated && <AccountPanel />}

      {/* Barra de guardado: solo aparece con cambios pendientes */}
      {isAuthenticated && (isDirty || saveState === 'saved' || saveState === 'error') && (
        <div className="no-print sticky bottom-20 z-20 lg:bottom-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
            {saveState === 'error' ? (
              <Notice tone="error" className="flex-1">
                {saveError}
              </Notice>
            ) : saveState === 'saved' && !isDirty ? (
              <span className="text-moss">Ajustes guardados en tu cuenta.</span>
            ) : (
              <span>Tienes cambios sin guardar.</span>
            )}
            {isDirty && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={resetToAccount}>
                  Deshacer cambios
                </Button>
                <Button loading={saveState === 'saving'} onClick={() => void saveToAccount()}>
                  Guardar ajustes
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
