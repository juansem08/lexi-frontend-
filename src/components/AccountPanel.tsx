import React, { useState } from 'react';
import { changePin, generateQrToken, setVisualToken } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { QrTokenResponse } from '../types/api';
import { QrCard } from './QrCard';
import { Button, Field, Notice, Section, inputClass } from './ui';
import { MIN_SEQUENCE, VisualSequencePicker } from './VisualSequencePicker';

type Status = { tone: 'success' | 'error'; text: string } | null;

/** Formas de entrar: PATCH /auth/pin, POST /auth/visual-token y POST /auth/qr-token. */
export const AccountPanel: React.FC = () => {
  const { student } = useAuth();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinStatus, setPinStatus] = useState<Status>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const [sequence, setSequence] = useState<string[]>([]);
  const [seqStatus, setSeqStatus] = useState<Status>(null);
  const [seqBusy, setSeqBusy] = useState(false);

  const [qr, setQr] = useState<QrTokenResponse | null>(null);
  const [qrStatus, setQrStatus] = useState<Status>(null);
  const [qrBusy, setQrBusy] = useState<'new' | 'rotate' | null>(null);

  if (!student) return null;

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinBusy(true);
    setPinStatus(null);
    try {
      await changePin(currentPin, newPin);
      setPinStatus({ tone: 'success', text: 'Tu PIN nuevo ya funciona.' });
      setCurrentPin('');
      setNewPin('');
    } catch (err) {
      setPinStatus({ tone: 'error', text: errorMessage(err, 'No se pudo cambiar el PIN.') });
    } finally {
      setPinBusy(false);
    }
  };

  const saveSequence = async () => {
    setSeqBusy(true);
    setSeqStatus(null);
    try {
      await setVisualToken(sequence);
      setSeqStatus({ tone: 'success', text: 'Ya puedes entrar con estos dibujos, en este orden.' });
      setSequence([]);
    } catch (err) {
      setSeqStatus({ tone: 'error', text: errorMessage(err, 'No se pudo guardar la secuencia.') });
    } finally {
      setSeqBusy(false);
    }
  };

  const makeQr = async (rotate: boolean) => {
    setQrBusy(rotate ? 'rotate' : 'new');
    setQrStatus(null);
    try {
      setQr(await generateQrToken(rotate));
      if (rotate) {
        setQrStatus({ tone: 'success', text: 'Las tarjetas anteriores ya no sirven. Imprime esta nueva.' });
      }
    } catch (err) {
      setQrStatus({ tone: 'error', text: errorMessage(err, 'No se pudo crear la tarjeta.') });
    } finally {
      setQrBusy(null);
    }
  };

  return (
    <Section title="Formas de entrar" description="Cambia tu PIN, tus dibujos o tu tarjeta QR.">
      <div className="grid gap-10 lg:grid-cols-2">
        <form onSubmit={savePin} className="space-y-4">
          <h3 className="text-lg font-semibold">PIN</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PIN actual" htmlFor="pin-current">
              <input
                id="pin-current"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tracking-[0.3em]`}
              />
            </Field>
            <Field label="PIN nuevo" htmlFor="pin-new">
              <input
                id="pin-new"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tracking-[0.3em]`}
              />
            </Field>
          </div>
          {pinStatus && <Notice tone={pinStatus.tone}>{pinStatus.text}</Notice>}
          <Button type="submit" variant="quiet" loading={pinBusy} disabled={currentPin.length < 4 || newPin.length < 4}>
            Cambiar PIN
          </Button>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dibujos</h3>
          <VisualSequencePicker value={sequence} onChange={setSequence} />
          {seqStatus && <Notice tone={seqStatus.tone}>{seqStatus.text}</Notice>}
          <Button variant="quiet" loading={seqBusy} disabled={sequence.length < MIN_SEQUENCE} onClick={() => void saveSequence()}>
            Guardar mis dibujos
          </Button>
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <h3 className="text-lg font-semibold">Tarjeta QR</h3>
        <p className="mt-1 max-w-2xl text-ink-soft">
          Si perdiste tu tarjeta, crea una nueva y anula las anteriores para que nadie más pueda usarlas.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="quiet" loading={qrBusy === 'new'} onClick={() => void makeQr(false)}>
            Ver mi tarjeta
          </Button>
          <Button variant="ghost" loading={qrBusy === 'rotate'} onClick={() => void makeQr(true)}>
            Crear una nueva y anular las anteriores
          </Button>
        </div>
        {qrStatus && (
          <Notice tone={qrStatus.tone} className="mt-4">
            {qrStatus.text}
          </Notice>
        )}
        {qr && (
          <div className="mt-6">
            <QrCard
              qrToken={qr.qrToken}
              displayName={student.displayName}
              studentCode={qr.studentCode}
              gradeLevel={student.gradeLevel}
              expiresAt={qr.expiresAt}
            />
          </div>
        )}
      </div>
    </Section>
  );
};
