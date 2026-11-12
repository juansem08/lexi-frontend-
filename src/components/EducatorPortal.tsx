import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { provisionStudent } from '../api/students';
import { errorMessage } from '../api/client';
import type { ProvisionedStudentResponse } from '../types/api';
import { QrCard } from './QrCard';
import { Button, Field, Notice, PageHeader, Section, cx, inputClass } from './ui';
import { MIN_SEQUENCE, VisualSequencePicker, iconLabel } from './VisualSequencePicker';

const KEY_STORAGE = 'lexi_admin_api_key';
const CODE_RE = /^[A-Z0-9][A-Z0-9_-]*$/;

function readKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

interface Created {
  student: ProvisionedStudentResponse;
  pin: string;
  sequence: string[];
}

export const EducatorPortal: React.FC = () => {
  const [adminKey, setAdminKey] = useState(readKey);
  const [showKey, setShowKey] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(4);
  const [classroomCode, setClassroomCode] = useState('');
  const [pin, setPin] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created[]>([]);
  const [selected, setSelected] = useState(0);

  const saveKey = (value: string) => {
    setAdminKey(value);
    try {
      if (value) sessionStorage.setItem(KEY_STORAGE, value);
      else sessionStorage.removeItem(KEY_STORAGE);
    } catch {
      /* sin almacenamiento */
    }
  };

  const code = studentCode.trim().toUpperCase();
  const problems: string[] = [];
  if (code && (code.length < 3 || !CODE_RE.test(code))) {
    problems.push('El código necesita de 3 a 32 letras, números o guiones, y empezar por letra o número.');
  }
  if (displayName && displayName.trim().length < 2) problems.push('El nombre necesita al menos 2 letras.');
  if (pin && !/^\d{4,6}$/.test(pin)) problems.push('El PIN necesita de 4 a 6 números.');
  if (sequence.length > 0 && sequence.length < MIN_SEQUENCE) {
    problems.push(`La secuencia de dibujos necesita al menos ${MIN_SEQUENCE} o ninguno.`);
  }
  const ready =
    adminKey.trim().length > 0 && code.length >= 3 && displayName.trim().length >= 2 && pin.length >= 4 && problems.length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const student = await provisionStudent(
        {
          studentCode: code,
          displayName: displayName.trim(),
          gradeLevel,
          classroomCode: classroomCode.trim() || undefined,
          pin,
          visualSequence: sequence.length >= MIN_SEQUENCE ? sequence : undefined,
        },
        adminKey.trim(),
      );
      setCreated((prev) => [{ student, pin, sequence }, ...prev]);
      setSelected(0);
      setStudentCode('');
      setDisplayName('');
      setPin('');
      setSequence([]);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear la cuenta.'));
    } finally {
      setLoading(false);
    }
  };

  const current = created[selected];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Para docentes"
        lead="Crea cuentas para tus estudiantes y prepara su tarjeta de acceso con QR, PIN y dibujos."
      />

      <Section>
        <Field
          label="Clave de educador"
          htmlFor="admin-key"
          hint="Es el ADMIN_API_KEY del backend. Se guarda solo hasta que cierres esta pestaña y nunca se muestra a estudiantes."
        >
          <div className="flex gap-2">
            <input
              id="admin-key"
              type={showKey ? 'text' : 'password'}
              value={adminKey}
              onChange={(e) => saveKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} font-mono text-base`}
            />
            <Button
              variant="quiet"
              aria-label={showKey ? 'Ocultar la clave' : 'Mostrar la clave'}
              onClick={() => setShowKey((v) => !v)}
              icon={showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            />
          </div>
        </Field>
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title="Nueva cuenta">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="edu-name">
                <input
                  id="edu-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="Lucas"
                  className={inputClass}
                />
              </Field>
              <Field label="Código de estudiante" htmlFor="edu-code">
                <input
                  id="edu-code"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  maxLength={32}
                  placeholder="LEX-003"
                  className={`${inputClass} font-semibold tracking-wide`}
                />
              </Field>
              <Field label="Grado" htmlFor="edu-grade">
                <select
                  id="edu-grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>
                      {g}.º grado
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Aula (opcional)" htmlFor="edu-class">
                <input
                  id="edu-class"
                  value={classroomCode}
                  onChange={(e) => setClassroomCode(e.target.value)}
                  maxLength={32}
                  placeholder="CLASS-4A"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="PIN" hint="De 4 a 6 números. Se guarda cifrado." htmlFor="edu-pin">
              <input
                id="edu-pin"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} max-w-48 font-mono tracking-[0.3em]`}
              />
            </Field>

            <div>
              <p className="font-semibold">Dibujos para entrar (opcional)</p>
              <p className="mb-2 text-sm text-ink-soft">Útil para quien todavía no recuerda números.</p>
              <VisualSequencePicker value={sequence} onChange={setSequence} />
            </div>

            {problems.length > 0 && (
              <Notice tone="info">
                <ul className="space-y-1">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}
            {!adminKey.trim() && <p className="text-ink-soft">Escribe la clave de educador para crear cuentas.</p>}

            <Button type="submit" size="lg" loading={loading} disabled={!ready}>
              Crear cuenta
            </Button>
          </form>
        </Section>

        <div>
          {current ? (
            <Section title="Tarjeta de acceso">
              {created.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {created.map((c, i) => (
                    <button
                      key={c.student.id}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={cx(
                        'rounded-lg px-3 py-1.5 text-sm font-semibold',
                        i === selected ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-soft hover:text-ink',
                      )}
                    >
                      {c.student.displayName}
                    </button>
                  ))}
                </div>
              )}
              <QrCard
                qrToken={current.student.qrToken}
                displayName={current.student.displayName}
                studentCode={current.student.studentCode}
                gradeLevel={current.student.gradeLevel}
                expiresAt={current.student.qrTokenExpiresAt}
                extra={
                  <div className="mt-4 border-t border-[#cfdad6] pt-3 text-left text-sm">
                    <p>
                      PIN: <strong className="font-mono text-base tracking-widest">{current.pin}</strong>
                    </p>
                    {current.sequence.length >= MIN_SEQUENCE && (
                      <p className="mt-1">Dibujos, en orden: {current.sequence.map(iconLabel).join(', ')}</p>
                    )}
                  </div>
                }
              />
              <p className="no-print mt-4 text-sm text-ink-soft">
                El PIN solo se muestra ahora. Imprime la tarjeta antes de salir de esta página.
              </p>
            </Section>
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center rounded-[20px] border-2 border-dashed border-line p-8 text-center text-ink-soft">
              Al crear una cuenta, su tarjeta lista para imprimir aparece aquí.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
