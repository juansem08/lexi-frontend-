import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  QrCode,
  Printer,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { provisionStudent } from '../api/students';
import type { ProvisionedStudentResponse } from '../types/api';

const AVAILABLE_ICONS = ['star', 'moon', 'leaf', 'sun', 'cloud', 'flower'];

export const EducatorPortal: React.FC = () => {
  const [adminApiKey, setAdminApiKey] = useState(
    localStorage.getItem('lexi_admin_api_key') || ''
  );
  const [studentCode, setStudentCode] = useState('LEX-003');
  const [displayName, setDisplayName] = useState('Lucas');
  const [gradeLevel, setGradeLevel] = useState(4);
  const [classroomCode, setClassroomCode] = useState('CLASS-4A');
  const [pin, setPin] = useState('5544');
  const [visualSequence, setVisualSequence] = useState<string[]>([
    'star',
    'leaf',
    'flower',
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] =
    useState<ProvisionedStudentResponse | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSaveApiKey = (key: string) => {
    setAdminApiKey(key);
    localStorage.setItem('lexi_admin_api_key', key);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminApiKey.trim()) {
      setError('Debes ingresar la clave de educador (x-admin-api-key).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await provisionStudent(
        {
          studentCode: studentCode.trim().toUpperCase(),
          displayName: displayName.trim(),
          gradeLevel,
          classroomCode: classroomCode.trim() || undefined,
          pin: pin.trim(),
          visualSequence:
            visualSequence.length >= 3 ? visualSequence : undefined,
        },
        adminApiKey.trim()
      );
      setCreatedStudent(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al aprovisionar al estudiante'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQr = () => {
    if (createdStudent?.qrToken) {
      navigator.clipboard.writeText(createdStudent.qrToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Portal del Educador / Tutor
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Aprovisiona cuentas para nuevos estudiantes, asigna PINs o secuencias visuales y genera sus tarjetas QR de acceso.
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
            Clave de Aprovisionamiento (ADMIN_API_KEY):
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="password"
              value={adminApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="Pega aquí la clave ADMIN_API_KEY del archivo .env..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <span className="mt-1 block text-xs text-indigo-600/80 dark:text-indigo-400/80">
            Esta clave se envía en el encabezado <code className="font-mono">x-admin-api-key</code> y nunca se comparte con los alumnos.
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form & Created Card Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create Student Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Registrar Nuevo Estudiante
            </h3>
          </div>

          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Código de Estudiante
                </label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  placeholder="LEX-003"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nombre a Mostrar
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Lucas"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Grado Escolar (1-12)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(parseInt(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Código de Aula
                </label>
                <input
                  type="text"
                  value={classroomCode}
                  onChange={(e) => setClassroomCode(e.target.value)}
                  placeholder="CLASS-4A"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PIN de Acceso (4 a 6 dígitos)
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="5544"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Secuencia Visual de Iconos ({visualSequence.join(' → ')})
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isIncluded = visualSequence.includes(iconName);
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        if (isIncluded) {
                          setVisualSequence(visualSequence.filter((i) => i !== iconName));
                        } else if (visualSequence.length < 6) {
                          setVisualSequence([...visualSequence, iconName]);
                        }
                      }}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                        isIncluded
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {iconName}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creando perfil en la API...' : 'Aprovisionar Estudiante'}
            </button>
          </form>
        </div>

        {/* Student Credential Card */}
        <div>
          {createdStudent ? (
            <div className="rounded-3xl border-2 border-emerald-400 bg-white p-6 shadow-xl dark:border-emerald-600 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-bold text-sm">¡Estudiante creado con éxito!</span>
                </div>
                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Tarjeta</span>
                </button>
              </div>

              {/* Printable Student Credential Card */}
              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center dark:border-indigo-800 dark:bg-indigo-950/30">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                  LexiLearn - Tarjeta de Lectura
                </span>
                <h3 className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">
                  {createdStudent.student.displayName}
                </h3>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  Código: {createdStudent.student.studentCode} | Grado:{' '}
                  {createdStudent.student.gradeLevel}°
                </p>

                {/* QR Code Graphic using qrserver generator */}
                <div className="mx-auto my-4 flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-2 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      createdStudent.qrToken
                    )}`}
                    alt="Código QR del estudiante"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>PIN: <strong className="font-mono">{pin}</strong></span>
                  <span>Secuencia: {visualSequence.join(' → ')}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyQr}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedToken ? '¡Copiado!' : 'Copiar Token QR en texto'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <QrCode className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                Tarjeta de Acceso del Alumno
              </h4>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Completa el formulario y aprovisiona al alumno para generar aquí su tarjeta de acceso con código QR descargable e imprimible.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
