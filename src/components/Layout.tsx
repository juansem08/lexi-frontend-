import React, { useState } from 'react';
import {
  BookOpen,
  Camera,
  Trophy,
  Sliders,
  GraduationCap,
  Sparkles,
  User,
  LogOut,
  Flame,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { ApiSettingsModal } from './ApiSettingsModal';
import { LoginModal } from './LoginModal';

export type ActiveTab = 'reader' | 'ocr' | 'gamification' | 'preferences' | 'educator';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ activeTab, setActiveTab, children }) => {
  const { student, isAuthenticated, logout } = useAuth();
  const { fontClass } = useAccessibility();

  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${fontClass}`}>
      {/* Top Accessible Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Lexi<span className="text-indigo-600 dark:text-indigo-400">Learn</span>
              </span>
              <span className="hidden text-xs text-slate-400 sm:block">
                Lectura asistiva & sensorial
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 md:flex dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'reader'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Lector Asistivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'ocr'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Escanear OCR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gamification')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'gamification'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Mi Progreso</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Accesibilidad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('educator')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'educator'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Educador</span>
            </button>
          </nav>

          {/* Right User & API Control */}
          <div className="flex items-center gap-3">
            {/* Server Settings Icon */}
            <button
              type="button"
              title="Configurar URL de la API"
              onClick={() => setIsApiSettingsOpen(true)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
            >
              <Server className="h-5 w-5" />
            </button>

            {isAuthenticated && student ? (
              <div className="flex items-center gap-3">
                {/* Gamification mini-chip */}
                <div className="hidden items-center gap-2 rounded-2xl bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/60 sm:flex">
                  <div className="flex items-center gap-1 text-xs font-black text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{student.progress?.totalXp ?? 0} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-orange-600 dark:text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{student.progress?.currentFocusStreak ?? 0}d</span>
                  </div>
                </div>

                {/* Student Profile Pill */}
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white text-xs">
                    {student.displayName.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {student.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    title="Cerrar sesión"
                    className="ml-1 text-slate-400 hover:text-rose-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
              >
                <User className="h-4 w-4" />
                <span>Entrar (PIN / QR / Iconos)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex overflow-x-auto border-t border-slate-100 p-2 md:hidden dark:border-slate-800">
          <div className="flex w-full justify-around gap-1 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('reader')}
              className={`rounded-xl px-2 py-1.5 ${
                activeTab === 'reader'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lector
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`rounded-xl px-2 py-1.5 ${
                activeTab === 'ocr'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              OCR
            </button>
            <button
              onClick={() => setActiveTab('gamification')}
              className={`rounded-xl px-2 py-1.5 ${
                activeTab === 'gamification'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Progreso
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`rounded-xl px-2 py-1.5 ${
                activeTab === 'preferences'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ajustes
            </button>
            <button
              onClick={() => setActiveTab('educator')}
              className={`rounded-xl px-2 py-1.5 ${
                activeTab === 'educator'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Educador
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Modals */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
      />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};
