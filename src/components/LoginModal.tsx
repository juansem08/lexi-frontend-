import React, { useEffect, useRef, useState } from 'react';
import { Camera, KeyRound, QrCode, Shapes } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { loginWithPin, loginWithQr, loginWithVisual } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Button, Field, Notice, Segmented, inputClass } from './ui';
import { MIN_SEQUENCE, VisualSequencePicker } from './VisualSequencePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Method = 'pin' | 'visual' | 'qr';

// Cuentas creadas por `npm run prisma:seed` en el backend.
const DEMO_ACCOUNTS = [
  { code: 'LEX-001', name: 'Sam', pin: '4821', sequence: ['star', 'moon', 'leaf'] },
  { code: 'LEX-002', name: 'Maya', pin: '7350', sequence: ['sun', 'cloud', 'flower'] },
];

const SCANNER_ID = 'qr-reader-region';

export const LoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { handleAuthSuccess } = useAuth();
  const [method, setMethod] = useState<Method>('pin');
  const [studentCode, setStudentCode] = useState('');
  const [pin, setPin] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* ya detenido */
      }
    }
  };

  useEffect(() => {
    if (!isOpen || method !== 'qr') void stopScanner();
  }, [isOpen, method]);

  useEffect(() => () => void stopScanner(), []);

  const run = async (action: () => Promise<Parameters<typeof handleAuthSuccess>[0]>) => {
    setLoading(true);
    setError(null);
    try {
      handleAuthSuccess(await action());
      setPin('');
      setSequence([]);
      setQrToken('');
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo entrar.'));
    } finally {
      setLoading(false);
    }
  };

  const code = studentCode.trim().toUpperCase();

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    // Espera a que el contenedor sea visible antes de iniciar la cámara.
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          void stopScanner();
          setQrToken(decoded);
          void run(() => loginWithQr(decoded.trim()));
        },
        () => {},
      );
    } catch {
      setError('No se pudo abrir la cámara. Revisa los permisos del navegador o pega el código.');
      void stopScanner();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Entrar a leer"
      description="Elige la forma que te resulte más cómoda."
    >
      <Segmented<Method>
        label="Forma de entrar"
        value={method}
        onChange={(m) => {
          setMethod(m);
          setError(null);
        }}
        options={[
          { id: 'pin', label: 'PIN', icon: <KeyRound className="h-4 w-4" /> },
          { id: 'visual', label: 'Dibujos', icon: <Shapes className="h-4 w-4" /> },
          { id: 'qr', label: 'Tarjeta QR', icon: <QrCode className="h-4 w-4" /> },
        ]}
      />

      {error && (
        <Notice tone="error" className="mt-5">
          {error}
        </Notice>
      )}

      {method !== 'qr' && (
        <div className="mt-5">
          <Field label="Tu código de estudiante" htmlFor="login-code">
            <input
              id="login-code"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
              placeholder="LEX-001"
              autoComplete="username"
              maxLength={32}
              className={`${inputClass} font-semibold tracking-wide`}
            />
          </Field>
        </div>
      )}

      {method === 'pin' && (
        <form
          className="mt-4 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => loginWithPin(code, pin.trim()));
          }}
        >
          <Field label="Tu PIN" hint="De 4 a 6 números." htmlFor="login-pin">
            <input
              id="login-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!code || pin.length < 4}
          >
            Entrar
          </Button>
        </form>
      )}

      {method === 'visual' && (
        <div className="mt-4 space-y-5">
          <VisualSequencePicker value={sequence} onChange={setSequence} concealTrail />
          <Button
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!code || sequence.length < MIN_SEQUENCE}
            onClick={() => void run(() => loginWithVisual(code, sequence))}
          >
            Entrar con mis dibujos
          </Button>
        </div>
      )}

      {method === 'qr' && (
        <div className="mt-5 space-y-4">
          <div
            id={SCANNER_ID}
            className={scanning ? 'overflow-hidden rounded-xl border-2 border-accent' : 'hidden'}
          />
          {scanning ? (
            <Button variant="quiet" className="w-full" onClick={() => void stopScanner()}>
              Cerrar la cámara
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              icon={<Camera className="h-5 w-5" />}
              onClick={() => void startScanner()}
              loading={loading}
            >
              Mostrar mi tarjeta a la cámara
            </Button>
          )}
          <Field
            label="¿Sin cámara?"
            hint="Pega el texto del código que te dio tu docente."
            htmlFor="login-qr"
          >
            <textarea
              id="login-qr"
              rows={3}
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              className={`${inputClass} font-mono text-sm`}
            />
          </Field>
          <Button
            variant="quiet"
            className="w-full"
            loading={loading && !scanning}
            disabled={!qrToken.trim()}
            onClick={() => void run(() => loginWithQr(qrToken.trim()))}
          >
            Entrar con este código
          </Button>
        </div>
      )}

      <div className="mt-7 border-t border-line pt-5">
        <p className="text-sm text-ink-soft">
          Cuentas de prueba del backend (creadas con <code>prisma:seed</code>):
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <Button
              key={d.code}
              variant="quiet"
              size="sm"
              onClick={() => {
                setStudentCode(d.code);
                setPin(d.pin);
                setSequence(d.sequence);
                setError(null);
              }}
            >
              Usar {d.name} ({d.code})
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
