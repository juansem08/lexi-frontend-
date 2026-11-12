import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Printer } from 'lucide-react';
import { Button } from './ui';

interface Props {
  qrToken: string;
  displayName: string;
  studentCode: string;
  gradeLevel?: number;
  expiresAt?: string;
  extra?: React.ReactNode;
}

/**
 * Tarjeta de acceso con QR generado en el navegador.
 * El token es una credencial: nunca se envía a servicios externos.
 */
export const QrCard: React.FC<Props> = ({
  qrToken,
  displayName,
  studentCode,
  gradeLevel,
  expiresAt,
  extra,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrToken, { margin: 1, width: 360, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div
        id="printable-card"
        className="mx-auto max-w-sm rounded-[20px] border-2 border-ink bg-white p-6 text-center text-[#1f2d3a]"
      >
        <p className="font-[Lexend] text-sm font-semibold text-[#2f6f8f]">Tarjeta de lectura LexiLearn</p>
        <p className="mt-2 font-[Lexend] text-3xl font-semibold">{displayName}</p>
        <p className="mt-1 text-lg">
          {studentCode}
          {gradeLevel ? `, grado ${gradeLevel}` : ''}
        </p>
        <div className="mx-auto my-5 flex h-56 w-56 items-center justify-center">
          {dataUrl ? (
            <img src={dataUrl} alt={`Código QR de acceso de ${displayName}`} className="h-full w-full" />
          ) : (
            <span className="text-sm">Generando código…</span>
          )}
        </div>
        <p className="text-sm">Muestra esta tarjeta a la cámara para entrar.</p>
        {expiresAt && (
          <p className="mt-1 text-xs text-[#52626f]">
            Válida hasta el {new Date(expiresAt).toLocaleDateString('es')}
          </p>
        )}
        {extra}
      </div>

      <div className="no-print mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="quiet" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Imprimir tarjeta
        </Button>
        <Button variant="ghost" icon={<Copy className="h-4 w-4" />} onClick={copy}>
          {copied ? 'Código copiado' : 'Copiar código QR como texto'}
        </Button>
      </div>
    </div>
  );
};
