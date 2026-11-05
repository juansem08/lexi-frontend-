import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StudentProfile, AuthResponse } from '../types/api';
import { getAuthToken, setAuthToken } from '../api/client';
import { getProfile } from '../api/students';

interface AuthContextType {
  student: StudentProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleAuthSuccess: (authData: AuthResponse) => void;
  updateLocalStudent: (updated: StudentProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      if (token) {
        try {
          const profile = await getProfile();
          setStudent(profile);
        } catch (err) {
          console.error('Session expired or server unavailable', err);
          setAuthToken(null);
          setTokenState(null);
          setStudent(null);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [token]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setAuthToken(authData.accessToken);
    setTokenState(authData.accessToken);
    setStudent(authData.student);
  };

  const updateLocalStudent = (updated: StudentProfile) => {
    setStudent(updated);
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setStudent(null);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const profile = await getProfile();
        setStudent(profile);
      } catch (err) {
        console.error('Failed to refresh profile', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        isAuthenticated: !!token && !!student,
        isLoading,
        handleAuthSuccess,
        updateLocalStudent,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
