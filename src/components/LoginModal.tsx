import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  QrCode,
  Sparkles,
  X,
  AlertCircle,
  Camera,
  Star,
  Moon,
  Sun,
  Cloud,
  Flower,
  Leaf,
  Heart,
  Zap,
  Music,
  Trees,
  RotateCcw,
} from 'lucide-react';
import { loginWithPin, loginWithQr, loginWithVisual } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'pin' | 'qr' | 'visual';

const VISUAL_ICONS = [
  { id: 'star', label: 'Estrella', icon: Star, color: 'text-amber-500 bg-amber-50' },
  { id: 'moon', label: 'Luna', icon: Moon, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'leaf', label: 'Hoja', icon: Leaf, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'sun', label: 'Sol', icon: Sun, color: 'text-orange-500 bg-orange-50' },
  { id: 'cloud', label: 'Nube', icon: Cloud, color: 'text-sky-500 bg-sky-50' },
  { id: 'flower', label: 'Flor', icon: Flower, color: 'text-pink-500 bg-pink-50' },
  { id: 'heart', label: 'Corazón', icon: Heart, color: 'text-rose-500 bg-rose-50' },
  { id: 'bolt', label: 'Rayo', icon: Zap, color: 'text-yellow-500 bg-yellow-50' },
  { id: 'music', label: 'Música', icon: Music, color: 'text-purple-500 bg-purple-50' },
  { id: 'tree', label: 'Árbol', icon: Trees, color: 'text-green-600 bg-green-50' },
];

export const LoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { handleAuthSuccess } = useAuth();
  const [tab, setTab] = useState<TabType>('pin');
  const [studentCode, setStudentCode] = useState('LEX-001');
  const [pin, setPin] = useState('4821');
  const [qrInput, setQrInput] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [visualSequence, setVisualSequence] = useState<string[]>(['star', 'moon', 'leaf']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && isScanningQr) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanningQr]);

  if (!isOpen) return null;

  const startQrScanner = async () => {
    setIsScanningQr(true);
    setError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader-region');
      qrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'user' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          setQrInput(decodedText);
          await scanner.stop();
          setIsScanningQr(false);
          // Auto submit QR
          handleLoginQr(decodedText);
        },
        () => {}
      );
    } catch {
      setError('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.');
      setIsScanningQr(false);
    }
  };

  const stopQrScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch {}
      setIsScanningQr(false);
    }
  };

  const handleLoginPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithPin({
        studentCode: studentCode.trim().toUpperCase(),
        pin: pin.trim(),
      });
      handleAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginQr = async (tokenToUse?: string) => {
    const finalToken = tokenToUse || qrInput;
    if (!finalToken.trim()) {
      setError('Por favor ingresa o escanea un token QR.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithQr({ qrToken: finalToken.trim() });
      handleAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al validar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVisual = async () => {
    if (visualSequence.length < 3) {
      setError('Selecciona al menos 3 iconos para tu secuencia.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithVisual({
        studentCode: studentCode.trim().toUpperCase(),
        imageSequence: visualSequence,
      });
      handleAuthSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Secuencia visual incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const setDemoStudent = (code: string, demoPin: string, seq: string[]) => {
    setStudentCode(code);
    setPin(demoPin);
    setVisualSequence(seq);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            ¡Hola! Inicia tu lectura
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Elige el método que te resulte más cómodo y amigable
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab('pin')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === 'pin'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Con PIN</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('qr')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === 'qr'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Código QR</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('visual')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === 'visual'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>Iconos</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: PIN Form */}
        {tab === 'pin' && (
          <form onSubmit={handleLoginPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tu Código de Estudiante
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="Ej. LEX-001"
                required
                className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tu PIN (4 a 6 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                required
                className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-black tracking-widest text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-lg transition-transform active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar a mi sesión'}
            </button>
          </form>
        )}

        {/* Tab 2: QR Scanner */}
        {tab === 'qr' && (
          <div className="space-y-4">
            <div
              id="qr-reader-region"
              className={`overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 ${
                isScanningQr ? 'h-64' : 'hidden'
              }`}
            ></div>

            {!isScanningQr ? (
              <button
                type="button"
                onClick={startQrScanner}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 py-4 font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <Camera className="h-6 w-6" />
                <span>Escanear con la Cámara Web</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopQrScanner}
                className="w-full rounded-2xl bg-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
              >
                Cancelar escaneo
              </button>
            )}

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="mx-3 shrink text-xs font-semibold uppercase text-slate-400">
                O pega tu token QR
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <div>
              <textarea
                rows={2}
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Pega el código QR firmado aquí..."
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={() => handleLoginQr()}
              disabled={loading || !qrInput.trim()}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-lg disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Iniciar con Código QR'}
            </button>
          </div>
        )}

        {/* Tab 3: Visual Icons */}
        {tab === 'visual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tu Código de Estudiante
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="Ej. LEX-001"
                className="mt-1 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Sequence preview box */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Secuencia Elegida ({visualSequence.length}/6):
                </label>
                {visualSequence.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setVisualSequence([])}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpiar
                  </button>
                )}
              </div>
              <div className="mt-1 flex min-h-[58px] items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                {visualSequence.length === 0 ? (
                  <span className="text-sm italic text-slate-400">
                    Pulsa los iconos abajo en el orden de tu clave secreta...
                  </span>
                ) : (
                  visualSequence.map((id, index) => {
                    const match = VISUAL_ICONS.find((i) => i.id === id);
                    if (!match) return null;
                    const IconComp = match.icon;
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-sm font-bold shadow-xs ${match.color}`}
                      >
                        <IconComp className="h-4 w-4" />
                        <span>{match.label}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Icons Grid */}
            <div className="grid grid-cols-5 gap-2">
              {VISUAL_ICONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (visualSequence.length < 6) {
                        setVisualSequence([...visualSequence, item.id]);
                      }
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition-transform hover:scale-105 active:scale-95 ${item.color}`}
                  >
                    <IconComp className="h-6 w-6" />
                    <span className="mt-1 text-[11px] font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLoginVisual}
              disabled={loading || visualSequence.length < 3}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-lg disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Iniciar con mis Iconos'}
            </button>
          </div>
        )}

        {/* Demo Fast Access (From Seed) */}
        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2 text-center text-xs font-semibold text-slate-400">
            Acceso Rápido de Prueba (Cuentas Seed de la API):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDemoStudent('LEX-001', '4821', ['star', 'moon', 'leaf'])}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Sam (LEX-001) ⭐🌙🍃
            </button>
            <button
              type="button"
              onClick={() => setDemoStudent('LEX-002', '7350', ['sun', 'cloud', 'flower'])}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Maya (LEX-002) ☀️☁️🌸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
