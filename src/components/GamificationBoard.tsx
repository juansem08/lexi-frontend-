import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Star,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStudentStats } from '../api/gamification';
import type { StudentStatsResponse } from '../types/api';

const ALL_POSSIBLE_BADGES = [
  {
    code: 'first-step',
    name: 'Primer Paso Amable',
    description: 'Completaste tu primera lectura asistida.',
    icon: '🌱',
  },
  {
    code: 'sentence-explorer',
    name: 'Explorador de Oraciones',
    description: 'Leíste y exploraste más de 10 oraciones.',
    icon: '🧭',
  },
  {
    code: 'focus-spark',
    name: 'Chispa de Enfoque',
    description: 'Mantuviste una sesión de concentración con calma.',
    icon: '✨',
  },
  {
    code: 'page-wanderer',
    name: 'Viajero de Páginas',
    description: 'Completaste páginas enteras a tu propio ritmo.',
    icon: '📖',
  },
  {
    code: 'steady-reader',
    name: 'Lector Constante',
    description: 'Construiste una racha de lectura sin presiones.',
    icon: '🌟',
  },
  {
    code: 'calm-finisher',
    name: 'Finalizador Sereno',
    description: 'Terminaste tus lecturas disfrutando cada palabra.',
    icon: '🏆',
  },
];

interface Props {
  onOpenLogin: () => void;
}

export const GamificationBoard: React.FC<Props> = ({ onOpenLogin }) => {
  const { student, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<StudentStatsResponse | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (isAuthenticated && student) {
        try {
          const data = await getStudentStats(student.id);
          setStats(data);
        } catch (err) {
          console.error('Failed to load student stats', err);
        }
      }
    }
    loadStats();
  }, [isAuthenticated, student]);

  if (!isAuthenticated || !student) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Trophy className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Tu Aventura de Progreso y Medallas
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Inicia sesión con tu PIN, código QR o secuencia de iconos para acumular puntos XP, guardar tus rachas amigables y desbloquear medallas de concentración.
        </p>
        <button
          type="button"
          onClick={onOpenLogin}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700"
        >
          <Sparkles className="h-5 w-5" />
          <span>Iniciar Sesión de Estudiante</span>
        </button>
      </div>
    );
  }

  const currentXp = stats?.totalXp ?? student.progress?.totalXp ?? 0;
  const currentLevel = stats?.level ?? student.progress?.level ?? 1;
  const levelProgressPercent = Math.min(100, Math.round((currentXp % 100)));

  const earnedBadgeCodes = new Set(stats?.badges.map((b) => b.code) || []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Level Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              Estudiante: {student.displayName} ({student.studentCode})
            </span>
            <h1 className="mt-2 text-3xl font-black">Nivel {currentLevel}</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Cada oración y página leída te acompaña en este viaje amable.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-black text-amber-300">
                <Sparkles className="h-7 w-7" />
                <span>{currentXp}</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-indigo-200">
                Puntos XP
              </span>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-black text-orange-300">
                <Flame className="h-7 w-7" />
                <span>{stats?.currentFocusStreak ?? 0}</span>
              </div>
              <span className="text-xs uppercase tracking-wider text-indigo-200">
                Días de Enfoque
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-bold text-indigo-200">
            <span>Progreso al Nivel {currentLevel + 1}</span>
            <span>{currentXp % 100} / 100 XP</span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-md">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {stats?.currentFocusStreak ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Racha actual</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {stats?.bestFocusStreak ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mejor racha</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {stats?.totalFocusDays ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Días totales</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {stats?.badges.length ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Medallas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Vitrina de Medallas Amables
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {stats?.badges.length || 0} de {ALL_POSSIBLE_BADGES.length} desbloqueadas
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_POSSIBLE_BADGES.map((b) => {
            const isEarned = earnedBadgeCodes.has(b.code);
            return (
              <div
                key={b.code}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                  isEarned
                    ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/30'
                    : 'border-slate-200 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                <div className="text-3xl shrink-0">{b.icon}</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {b.name}
                    </h3>
                    {isEarned ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      {stats && stats.recentSessions && stats.recentSessions.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Sesiones de Lectura Recientes
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {new Date(session.startedAt).toLocaleDateString()} -{' '}
                    {Math.round(session.durationSeconds / 60)} minutos
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{session.chunksProcessed} fragmentos</span>
                  <span>{session.interactions} interacciones</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
