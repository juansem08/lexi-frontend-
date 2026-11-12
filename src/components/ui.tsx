import React from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'quiet' | 'ghost' | 'moss';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110',
  moss: 'bg-moss text-accent-ink hover:brightness-110',
  quiet: 'bg-surface-2 text-ink hover:bg-line',
  ghost: 'text-ink-soft hover:bg-surface-2 hover:text-ink',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[filter,background-color] disabled:cursor-not-allowed disabled:opacity-50',
      size === 'lg' && 'min-h-14 px-6 text-lg',
      size === 'md' && 'min-h-11 px-4 text-base',
      size === 'sm' && 'min-h-9 px-3 text-sm',
      BUTTON_STYLES[variant],
      className,
    )}
    {...rest}
  >
    {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : icon}
    {children}
  </button>
);

export const PageHeader: React.FC<{
  title: string;
  lead?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, lead, action }) => (
  <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      {lead && <p className="mt-2 text-lg text-ink-soft">{lead}</p>}
    </div>
    {action}
  </header>
);

export const Section: React.FC<{
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => (
  <section className={cx('rounded-[20px] border border-line bg-surface p-5 sm:p-7', className)}>
    {title && <h2 className="text-xl font-semibold text-ink">{title}</h2>}
    {description && <p className="mt-1 text-ink-soft">{description}</p>}
    <div className={title || description ? 'mt-5' : undefined}>{children}</div>
  </section>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="block font-semibold text-ink">
      {label}
    </label>
    {hint && <p className="text-sm text-ink-soft">{hint}</p>}
    <div className="mt-1.5">{children}</div>
  </div>
);

export const inputClass =
  'w-full rounded-xl border-2 border-line bg-bg px-4 py-2.5 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none';

type Tone = 'error' | 'success' | 'info';

export const Notice: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({
  tone,
  children,
  className,
}) => {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-3 rounded-xl px-4 py-3',
        tone === 'error' && 'bg-danger-soft text-ink',
        tone === 'success' && 'bg-moss-soft text-ink',
        tone === 'info' && 'bg-accent-soft text-ink',
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cx(
          'mt-0.5 h-5 w-5 shrink-0',
          tone === 'error' && 'text-danger',
          tone === 'success' && 'text-moss',
          tone === 'info' && 'text-accent',
        )}
      />
      <div>{children}</div>
    </div>
  );
};

/** Grupo de opciones exclusivas (radiogroup accesible). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  onChange: (id: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-surface-2 p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cx(
              'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold',
              active ? 'bg-surface text-ink shadow-[0_1px_0_var(--line)]' : 'text-ink-soft hover:text-ink',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
