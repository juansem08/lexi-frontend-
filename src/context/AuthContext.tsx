import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthResponse, StudentProfile, StudentStatsResponse } from '../types/api';
import { getAuthToken, setAuthToken, SESSION_EXPIRED_EVENT } from '../api/client';
import { getProfile } from '../api/students';
import { getStudentStats } from '../api/gamification';

interface AuthContextType {
  student: StudentProfile | null;
  stats: StudentStatsResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  handleAuthSuccess: (authData: AuthResponse) => void;
  updateLocalStudent: (updated: StudentProfile) => void;
  refreshStats: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<StudentStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!getAuthToken());
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setStudent(null);
    setStats(null);
  }, []);

  const loadStats = useCallback(async (id: string) => {
    try {
      setStats(await getStudentStats(id));
    } catch (err) {
      console.error('No se pudieron cargar las estadísticas', err);
    }
  }, []);

  // Recupera la sesión guardada al abrir la página.
  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled) return;
        setStudent(profile);
        void loadStats(profile.id);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearSession, loadStats]);

  // Cualquier 401 con token guardado cierra la sesión local.
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [clearSession]);

  const handleAuthSuccess = useCallback(
    (authData: AuthResponse) => {
      setAuthToken(authData.accessToken);
      setStudent(authData.student);
      setSessionExpired(false);
      void loadStats(authData.student.id);
    },
    [loadStats],
  );

  const refreshStats = useCallback(async () => {
    if (student) await loadStats(student.id);
  }, [student, loadStats]);

  return (
    <AuthContext.Provider
      value={{
        student,
        stats,
        isAuthenticated: !!student,
        isLoading,
        sessionExpired,
        handleAuthSuccess,
        updateLocalStudent: setStudent,
        refreshStats,
        logout: clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
