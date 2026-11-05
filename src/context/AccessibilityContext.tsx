import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AccessibilityPreferences, FontFamily } from '../types/api';
import { useAuth } from './AuthContext';
import { updatePreferences as apiUpdatePreferences } from '../api/students';

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  preferredFont: 'OPEN_DYSLEXIC',
  letterSpacing: 0.05,
  lineHeight: 1.6,
  contrastMode: 'LIGHT',
  lineFocusWindowSize: 3,
  ttsVoicePersona: 'CHILD_FRIENDLY',
  speechRate: 1.0,
  speechPitch: 1.0,
  highlightPacing: 'BALANCED',
  reduceMotion: false,
  soundEffects: false,
};

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  fontClass: string;
  updateLocalPref: (updates: Partial<AccessibilityPreferences>) => void;
  savePreferences: (updates: Partial<AccessibilityPreferences>) => Promise<void>;
  isSaving: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student, updateLocalStudent } = useAuth();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with student profile on login or profile update
  useEffect(() => {
    if (student) {
      setPreferences({
        preferredFont: student.preferredFont || 'OPEN_DYSLEXIC',
        letterSpacing: student.letterSpacing ?? 0.05,
        lineHeight: student.lineHeight ?? 1.6,
        contrastMode: student.contrastMode || 'LIGHT',
        lineFocusWindowSize: student.lineFocusWindowSize ?? 3,
        ttsVoicePersona: student.ttsVoicePersona || 'CHILD_FRIENDLY',
        speechRate: student.speechRate ?? 1.0,
        speechPitch: student.speechPitch ?? 1.0,
        highlightPacing: student.highlightPacing || 'BALANCED',
        reduceMotion: student.reduceMotion ?? false,
        soundEffects: student.soundEffects ?? false,
      });
    }
  }, [student]);

  // Apply visual styling to document
  useEffect(() => {
    // Contrast mode class on body
    document.body.classList.remove('contrast-light', 'contrast-dark', 'contrast-pastel', 'contrast-high');
    const contrastClass = `contrast-${preferences.contrastMode.toLowerCase().replace('_', '-')}`;
    document.body.classList.add(contrastClass);

    // Reduced motion
    if (preferences.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [preferences.contrastMode, preferences.reduceMotion]);

  const getFontClass = (font: FontFamily): string => {
    switch (font) {
      case 'OPEN_DYSLEXIC':
        return 'font-opendyslexic';
      case 'ATKINSON_HYPERLEGIBLE':
        return 'font-atkinson';
      case 'VERDANA':
        return 'font-verdana';
      case 'ARIAL':
        return 'font-arial';
      case 'COMIC_SANS':
        return 'font-comic';
      default:
        return 'font-opendyslexic';
    }
  };

  const updateLocalPref = (updates: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const savePreferences = async (updates: Partial<AccessibilityPreferences>) => {
    updateLocalPref(updates);
    if (student) {
      setIsSaving(true);
      try {
        const updatedStudent = await apiUpdatePreferences(updates);
        updateLocalStudent(updatedStudent);
      } catch (err) {
        console.error('Failed to save preferences to server', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        fontClass: getFontClass(preferences.preferredFont),
        updateLocalPref,
        savePreferences,
        isSaving,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
