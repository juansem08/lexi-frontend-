import React, { useState } from 'react';
import { BookOpenText, GraduationCap, LogOut, ScanText, Sprout, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApiHealth } from '../hooks/useApiHealth';
import { ApiSettingsModal } from './ApiSettingsModal';
import { Button, cx } from './ui';

export type ActiveTab = 'reader' | 'ocr' | 'gamification' | 'preferences' | 'educator';

const NAV: Array<{ id: ActiveTab; label: string; short: string; Icon: typeof BookOpenText }> = [
  { id: 'reader', label: 'Leer', short: 'Leer', Icon: BookOpenText },
  { id: 'ocr', label: 'Escanear una página', short: 'Escanear', Icon: ScanText },
  { id: 'gamification', label: 'Mi progreso', short: 'Progreso', Icon: Sprout },
  { id: 'preferences', label: 'Ajustes de lectura', short: 'Ajustes', Icon: SlidersHorizontal },
];

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenLogin: () => void;
  children: React.ReactNode;
}

/** Marca: dos páginas abiertas con una línea de lectura resaltada. */
const BrandMark: React.FC = () => (
  <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
    <rect width="40" height="40" rx="12" fill="var(--accent)" />
    <path d="M8 12c4-1.5 8-1.5 12 1v16c-4-2.5-8-2.5-12-1z" fill="var(--accent-ink)" opacity=".95" />
    <path d="M32 12c-4-1.5-8-1.5-12 1v16c4-2.5 8-2.5 12-1z" fill="var(--accent-ink)" opacity=".75" />
    <rect x="10" y="19" width="20" height="4" rx="2" fill="var(--ruler)" />
  </svg>
);

const ConnectionStatus: React.FC<{ onClick: () => void; compact?: boolean }> = ({
  onClick,
  compact,
}) => {
  const { state } = useApiHealth();
  const label =
    state === null
      ? 'Comprobando la API…'
      : state.kind === 'ok'
        ? 'API conectada'
        : state.kind === 'degraded'
          ? 'Base de datos sin respuesta'
          : 'API sin conexión';
  const color =
    state === null ? 'bg-ink-soft' : state.kind === 'ok' ? 'bg-moss' : 'bg-danger';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex items-center gap-2.5 rounded-xl text-left text-sm text-ink-soft hover:bg-surface-2 hover:text-ink',
        compact ? 'p-3.5' : 'w-full px-3 py-2.5',
      )}
      title={`${label}. Configurar la conexión.`}
    >
      <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', color)} aria-hidden />
      <span className={compact ? 'sr-only' : 'truncate'}>{label}</span>
    </button>
  );
};

const StudentCard: React.FC<{ onOpenLogin: () => void }> = ({ onOpenLogin }) => {
  const { student, stats, logout, isLoading } = useAuth();

  if (isLoading) return <div className="h-28 rounded-2xl bg-surface-2" aria-hidden />;

  if (!student) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-ink">Entra para guardar tu progreso y tus ajustes.</p>
        <Button className="mt-3 w-full" onClick={onOpenLogin}>
          Entrar
        </Button>
      </div>
    );
  }

  const p = stats?.progress;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-[Lexend] text-lg font-semibold text-accent"
          aria-hidden
        >
          {student.displayName.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{student.displayName}</p>
          <p className="text-sm text-ink-soft">{student.studentCode}</p>
        </div>
      </div>
      {p && (
        <div className="mt-3">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-ink">Nivel {p.level}</span>
            <span className="text-ink-soft">{p.totalXp} XP</span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-label="Avance hacia el siguiente nivel"
            aria-valuenow={Math.round(p.levelProgressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-moss" style={{ width: `${p.levelProgressPercent}%` }} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={logout}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Salir
      </button>
    </div>
  );
};

export const Layout: React.FC<Props> = ({ activeTab, setActiveTab, onOpenLogin, children }) => {
  const { student, sessionExpired, logout } = useAuth();
  const [apiOpen, setApiOpen] = useState(false);

  const navButton = (id: ActiveTab, label: string, Icon: typeof BookOpenText) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[1.05rem]',
          active ? 'bg-accent-soft font-semibold text-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
        )}
      >
        <Icon className={cx('h-5 w-5', active && 'text-accent')} aria-hidden />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Ir al contenido
      </a>

      {/* Barra lateral (escritorio) */}
      <aside className="no-print sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-bg px-4 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark />
          <div>
            <p className="font-[Lexend] text-xl font-semibold text-ink">LexiLearn</p>
            <p className="text-sm text-ink-soft">Lectura a tu ritmo</p>
          </div>
        </div>

        <nav aria-label="Principal" className="space-y-1">
          {NAV.map((n) => navButton(n.id, n.label, n.Icon))}
        </nav>

        <div className="mt-auto space-y-3">
          <StudentCard onOpenLogin={onOpenLogin} />
          <div className="space-y-1 border-t border-line pt-3">
            {navButton('educator', 'Para docentes', GraduationCap)}
            <ConnectionStatus onClick={() => setApiOpen(true)} />
          </div>
        </div>
      </aside>

      {/* Barra superior (móvil y tableta) */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <p className="font-[Lexend] text-lg font-semibold text-ink">LexiLearn</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('educator')}
            aria-label="Para docentes"
            className={cx(
              'rounded-xl p-2.5',
              activeTab === 'educator' ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-surface-2',
            )}
          >
            <GraduationCap className="h-5 w-5" />
          </button>
          <ConnectionStatus compact onClick={() => setApiOpen(true)} />
          {student ? (
            <button
              type="button"
              onClick={logout}
              aria-label={`Salir de la cuenta de ${student.displayName}`}
              title={`Salir (${student.displayName})`}
              className="inline-flex items-center gap-1.5 rounded-xl p-2.5 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">Salir</span>
            </button>
          ) : (
            <Button size="sm" onClick={onOpenLogin}>
              Entrar
            </Button>
          )}
        </div>
      </header>

      <main id="main" className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-12 lg:pt-10">
        {sessionExpired && !student && (
          <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3">
            <span>Tu sesión terminó. Tu progreso está guardado; entra de nuevo para seguir.</span>
            <Button size="sm" onClick={onOpenLogin}>
              Entrar de nuevo
            </Button>
          </div>
        )}
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Pestañas inferiores (móvil) */}
      <nav
        aria-label="Principal"
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface lg:hidden"
      >
        {NAV.map(({ id, short, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 text-xs font-semibold',
                active ? 'text-accent' : 'text-ink-soft',
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
              {short}
            </button>
          );
        })}
      </nav>

      <ApiSettingsModal isOpen={apiOpen} onClose={() => setApiOpen(false)} />
    </div>
  );
};
