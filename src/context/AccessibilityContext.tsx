import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AccessibilityPreferences, FontFamily } from '../types/api';
import { useAuth } from './AuthContext';
import { updatePreferences as apiUpdatePreferences } from '../api/students';
import { errorMessage } from '../api/client';

// Mismos valores por defecto que el esquema Prisma del backend.
export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  preferredFont: 'OPEN_DYSLEXIC',
  letterSpacing: 0.05,
  lineHeight: 1.6,
  contrastMode: 'LIGHT',
  lineFocusWindowSize: 3,
  ttsVoicePersona: 'CHILD_FRIENDLY',
  speechRate: 1,
  speechPitch: 1,
  highlightPacing: 'BALANCED',
  reduceMotion: true,
  soundEffects: false,
};

const GUEST_KEY = 'lexi_guest_preferences';

export const FONT_STACKS: Record<FontFamily, string> = {
  OPEN_DYSLEXIC: "'OpenDyslexic', 'Atkinson Hyperlegible', sans-serif",
  ATKINSON_HYPERLEGIBLE: "'Atkinson Hyperlegible', sans-serif",
  VERDANA: 'Verdana, Geneva, Tahoma, sans-serif',
  ARIAL: 'Arial, Helvetica, sans-serif',
  COMIC_SANS: "'Comic Sans MS', 'Comic Neue', cursive, sans-serif",
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  /** Hay cambios locales aún no guardados en la cuenta. */
  isDirty: boolean;
  saveState: SaveState;
  saveError: string | null;
  updateLocalPref: (updates: Partial<AccessibilityPreferences>) => void;
  saveToAccount: () => Promise<void>;
  resetToAccount: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function readGuestPrefs(): AccessibilityPreferences {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AccessibilityPreferences>) };
  } catch {
    /* sin almacenamiento */
  }
  return DEFAULT_PREFERENCES;
}

function diff(
  next: AccessibilityPreferences,
  base: AccessibilityPreferences,
): Partial<AccessibilityPreferences> {
  const out: Record<string, unknown> = {};
  (Object.keys(next) as Array<keyof AccessibilityPreferences>).forEach((k) => {
    if (next[k] !== base[k]) out[k] = next[k];
  });
  return out as Partial<AccessibilityPreferences>;
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student, updateLocalStudent } = useAuth();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readGuestPrefs);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const accountPrefs = student?.accessibility ?? null;

  // Al entrar, el perfil guardado en la API manda.
  useEffect(() => {
    if (accountPrefs) setPreferences(accountPrefs);
  }, [accountPrefs]);

  // Aplica contraste, fuente y movimiento a toda la página.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = preferences.contrastMode.toLowerCase().replace('_', '-');
    root.style.setProperty('--reader-font', FONT_STACKS[preferences.preferredFont]);
    root.style.setProperty('--reader-tracking', `${preferences.letterSpacing}em`);
    root.style.setProperty('--reader-leading', String(preferences.lineHeight));
    root.classList.toggle('reduce-motion', preferences.reduceMotion);
  }, [preferences]);

  // Los invitados conservan sus ajustes en este navegador.
  useEffect(() => {
    if (student) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(preferences));
    } catch {
      /* sin almacenamiento */
    }
  }, [preferences, student]);

  const updateLocalPref = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
    setSaveState('idle');
  }, []);

  const changes = accountPrefs ? diff(preferences, accountPrefs) : {};
  const isDirty = Object.keys(changes).length > 0;

  const saveToAccount = async () => {
    if (!student || !isDirty) return;
    setSaveState('saving');
    setSaveError(null);
    try {
      const updated = await apiUpdatePreferences(changes);
      updateLocalStudent(updated);
      setSaveState('saved');
    } catch (err) {
      setSaveError(errorMessage(err, 'No se pudieron guardar los ajustes.'));
      setSaveState('error');
    }
  };

  const resetToAccount = () => {
    setPreferences(accountPrefs ?? DEFAULT_PREFERENCES);
    setSaveState('idle');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        isDirty,
        saveState,
        saveError,
        updateLocalPref,
        saveToAccount,
        resetToAccount,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
}
