import React from 'react';
import {
  Sliders,
  Type,
  Palette,
  Volume2,
  Check,
  Save,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import type { FontFamily, ContrastMode, TtsVoicePersona } from '../types/api';

const FONTS: { id: FontFamily; label: string; desc: string }[] = [
  { id: 'OPEN_DYSLEXIC', label: 'OpenDyslexic', desc: 'Diseñada para evitar la rotación visual de letras' },
  { id: 'ATKINSON_HYPERLEGIBLE', label: 'Atkinson Hyperlegible', desc: 'Máxima distinción entre caracteres similares' },
  { id: 'VERDANA', label: 'Verdana', desc: 'Excelente legibilidad en pantallas' },
  { id: 'ARIAL', label: 'Arial', desc: 'Tipografía neutra y limpia' },
  { id: 'COMIC_SANS', label: 'Comic Sans', desc: 'Formas amigables para niños y dislexia leve' },
];

const CONTRASTS: { id: ContrastMode; label: string; bg: string; text: string }[] = [
  { id: 'LIGHT', label: 'Modo Claro', bg: 'bg-white', text: 'text-slate-800' },
  { id: 'DARK', label: 'Modo Oscuro', bg: 'bg-slate-900', text: 'text-slate-100' },
  { id: 'PASTEL', label: 'Pastel Cálido', bg: 'bg-[#fdfbf7]', text: 'text-stone-800' },
  { id: 'HIGH_CONTRAST', label: 'Alto Contraste', bg: 'bg-black', text: 'text-yellow-300' },
];

const TTS_PERSONAS: { id: TtsVoicePersona; label: string; desc: string }[] = [
  { id: 'CHILD_FRIENDLY', label: 'Voz Infantil', desc: 'Cálida, pausada y cercana para niños' },
  { id: 'CALM_NARRATOR', label: 'Narrador Calmo', desc: 'Tono sereno y relajante para concentración' },
  { id: 'NEURAL_FRIENDLY', label: 'Voz Neuronal Fluida', desc: 'Articulación clara y natural' },
];

export const PreferencesPanel: React.FC = () => {
  const { preferences, fontClass, updateLocalPref, savePreferences, isSaving } = useAccessibility();
  const { isAuthenticated } = useAuth();

  const handleSave = async () => {
    await savePreferences(preferences);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Ajustes de Accesibilidad y Lectura
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Personaliza la experiencia visual y auditiva según tus necesidades sensoriales.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando en tu cuenta...' : 'Guardar Ajustes'}</span>
          </button>
        )}
      </div>

      {/* Live Preview Box */}
      <div className="rounded-3xl border-2 border-indigo-200 bg-white p-6 shadow-md dark:border-indigo-900 dark:bg-slate-900">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Vista Previa en Vivo
        </h3>
        <div
          className={`rounded-2xl border border-slate-200 p-6 transition-all ${fontClass} ${
            preferences.contrastMode === 'DARK'
              ? 'bg-slate-900 text-slate-100'
              : preferences.contrastMode === 'PASTEL'
              ? 'bg-[#fdfbf7] text-stone-800'
              : preferences.contrastMode === 'HIGH_CONTRAST'
              ? 'bg-black text-yellow-300'
              : 'bg-slate-50 text-slate-800'
          }`}
          style={{
            letterSpacing: `${preferences.letterSpacing}em`,
            lineHeight: preferences.lineHeight,
          }}
        >
          <p className="text-xl">
            La lectura es un camino tranquilo. Al ajustar el espaciado, la tipografía y el tamaño de las líneas, cada palabra encuentra su lugar.
          </p>
        </div>
      </div>

      {/* 1. Typography Selection */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Type className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Tipografía Amigable
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FONTS.map((font) => {
            const isSelected = preferences.preferredFont === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => updateLocalPref({ preferredFont: font.id })}
                className={`flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {font.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{font.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Contrast Modes */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Modos de Contraste y Descanso Visual
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CONTRASTS.map((c) => {
            const isSelected = preferences.contrastMode === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => updateLocalPref({ contrastMode: c.id })}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-indigo-600 shadow-md ring-2 ring-indigo-400 dark:border-indigo-400'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center font-bold text-xs ${c.bg} ${c.text}`}
                >
                  Aa
                </div>
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Spacing & Focus Slider Controls */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Letter Spacing */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Espaciado entre Letras: {preferences.letterSpacing}em
          </label>
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.02"
            value={preferences.letterSpacing}
            onChange={(e) => updateLocalPref({ letterSpacing: parseFloat(e.target.value) })}
            className="mt-4 w-full accent-indigo-600"
          />
          <span className="mt-2 block text-xs text-slate-400">
            Separa caracteres para evitar amontonamiento visual.
          </span>
        </div>

        {/* Line Height */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Altura de Línea: {preferences.lineHeight}x
          </label>
          <input
            type="range"
            min="1.2"
            max="2.6"
            step="0.1"
            value={preferences.lineHeight}
            onChange={(e) => updateLocalPref({ lineHeight: parseFloat(e.target.value) })}
            className="mt-4 w-full accent-indigo-600"
          />
          <span className="mt-2 block text-xs text-slate-400">
            Espacio vertical entre renglones de lectura.
          </span>
        </div>

        {/* Line Focus Window */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Ventana de Enfoque: {preferences.lineFocusWindowSize} líneas
          </label>
          <input
            type="range"
            min="1"
            max="6"
            step="1"
            value={preferences.lineFocusWindowSize}
            onChange={(e) => updateLocalPref({ lineFocusWindowSize: parseInt(e.target.value) })}
            className="mt-4 w-full accent-indigo-600"
          />
          <span className="mt-2 block text-xs text-slate-400">
            Líneas que permanecen iluminadas a la vez.
          </span>
        </div>
      </div>

      {/* 4. Audio & TTS Settings */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Ajustes de Voz y Lectura en Audio (TTS)
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TTS_PERSONAS.map((item) => {
            const isSelected = preferences.ttsVoicePersona === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateLocalPref({ ttsVoicePersona: item.id })}
                className={`flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{item.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Speed & Pitch Controls */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Velocidad de Lectura: {preferences.speechRate}x
            </label>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={preferences.speechRate}
              onChange={(e) => updateLocalPref({ speechRate: parseFloat(e.target.value) })}
              className="mt-3 w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0.75x (Muy pausado)</span>
              <span>1.0x (Normal)</span>
              <span>1.25x (Rápido)</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Tono de Voz: {preferences.speechPitch}x
            </label>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={preferences.speechPitch}
              onChange={(e) => updateLocalPref({ speechPitch: parseFloat(e.target.value) })}
              className="mt-3 w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0.75x (Grave)</span>
              <span>1.0x (Estándar)</span>
              <span>1.5x (Agudo)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sensory Comfort Toggles */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">
          Comodidad Sensorial (Anti-sobreestimulación)
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-100">
                Reducir Movimiento
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Desactiva transiciones rápidas y confeti para evitar mareo visual.
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(e) => updateLocalPref({ reduceMotion: e.target.checked })}
              className="h-5 w-5 rounded-md accent-indigo-600"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-100">
                Efectos de Sonido
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Activa campanadas suaves en recompensas (silenciado por defecto).
              </span>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEffects}
              onChange={(e) => updateLocalPref({ soundEffects: e.target.checked })}
              className="h-5 w-5 rounded-md accent-indigo-600"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
