import React, { useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BADGE_CATALOG } from '../lib/badges';
import type { ProgressSummary } from '../types/api';
import { Button, PageHeader, Section, cx } from './ui';

interface Props {
  onOpenLogin: () => void;
}

const LevelRing: React.FC<{ progress: ProgressSummary }> = ({ progress }) => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, progress.levelProgressPercent));
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={`Nivel ${progress.level}, ${Math.round(pct)} % hacia el siguiente`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--moss)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="58" textAnchor="middle" fontFamily="Lexend" fontSize="34" fontWeight="600" fill="var(--ink)">
          {progress.level}
        </text>
        <text x="60" y="80" textAnchor="middle" fontSize="12" fill="var(--ink-soft)">
          nivel
        </text>
      </svg>
      <div>
        <p className="font-[Lexend] text-3xl font-semibold">{progress.totalXp} XP</p>
        <p className="mt-1 text-ink-soft">
          {progress.xpForNextLevel - progress.xpIntoLevel} XP para llegar al nivel {progress.level + 1}
        </p>
      </div>
    </div>
  );
};

export const GamificationBoard: React.FC<Props> = ({ onOpenLogin }) => {
  const { student, stats, isAuthenticated, refreshStats } = useAuth();

  useEffect(() => {
    if (isAuthenticated) void refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated || !student) {
    return (
      <div>
        <PageHeader
          title="Mi progreso"
          lead="Aquí verás tu nivel, tus días de lectura y las insignias que vas encontrando. Nada se pierde si descansas."
        />
        <Button size="lg" onClick={onOpenLogin}>
          Entrar para ver mi progreso
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <PageHeader title="Mi progreso" />
        <div className="h-64 rounded-[20px] bg-surface-2" aria-label="Cargando progreso" />
      </div>
    );
  }

  const earned = new Map(stats.badges.map((b) => [b.code, b]));
  const leaves = Math.min(stats.focus.focusDays, 30);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hola, ${student.displayName}`}
        lead="Cada día de lectura cuenta. Los días de descanso nunca te quitan nada."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section>
          <LevelRing progress={stats.progress} />
        </Section>

        <Section>
          <p className="font-[Lexend] text-3xl font-semibold">
            {stats.focus.focusDays} {stats.focus.focusDays === 1 ? 'día' : 'días'} de lectura
          </p>
          <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
            {Array.from({ length: leaves }).map((_, i) => (
              <Leaf key={i} className="h-6 w-6 text-moss" />
            ))}
            {stats.focus.focusDays > leaves && (
              <span className="self-center pl-1 text-ink-soft">y {stats.focus.focusDays - leaves} más</span>
            )}
            {leaves === 0 && <span className="text-ink-soft">Tu primera hoja aparece el día que leas.</span>}
          </div>
          <p className="mt-3 text-ink-soft">
            {stats.focus.currentStreak > 0
              ? `Llevas ${stats.focus.currentStreak} ${stats.focus.currentStreak === 1 ? 'día seguido' : 'días seguidos'}. `
              : ''}
            Tu mejor racha fue de {stats.focus.bestStreak} {stats.focus.bestStreak === 1 ? 'día' : 'días'}.
          </p>
        </Section>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ['Minutos leídos', stats.totalReadingMinutes],
          ['Oraciones leídas', stats.rewards.sentences],
          ['Páginas terminadas', stats.rewards.pages],
          ['Sesiones completas', stats.sessionsCompleted],
          ['Fotos escaneadas', stats.textsProcessed],
        ].map(([label, value]) => (
          <div key={label as string} className="border-l-4 border-line pl-4">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="font-[Lexend] text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <Section
        title="Insignias"
        description={`Tienes ${stats.badges.length} de ${BADGE_CATALOG.length}. Las insignias no caducan.`}
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGE_CATALOG.map((b) => {
            const got = earned.get(b.code);
            return (
              <li
                key={b.code}
                className={cx(
                  'flex gap-4 rounded-2xl p-4',
                  got ? 'bg-moss-soft' : 'border-2 border-dashed border-line',
                )}
              >
                <span className={cx('text-4xl leading-none', !got && 'opacity-30 grayscale')} aria-hidden>
                  {b.icon}
                </span>
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{got ? b.description : b.howTo}</p>
                  {got && (
                    <p className="mt-1 text-sm text-moss">
                      Conseguida el {new Date(got.earnedAt).toLocaleDateString('es')}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
};
