import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, RotateCcw } from 'lucide-react';
import { extractOcr } from '../api/ocr';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { normalizeKey } from '../lib/reading';
import type { OcrExtractResponse } from '../types/api';
import type { ReaderSource } from './ReaderView';
import { Button, Notice, PageHeader } from './ui';

interface Props {
  onTextExtracted: (source: ReaderSource) => void;
  onOpenLogin: () => void;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

export const OcrUploader: React.FC<Props> = ({ onTextExtracted, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const choose = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError('La imagen debe ser PNG, JPEG o WebP.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('La imagen debe pesar menos de 10 MB.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
      });
      streamRef.current = stream;
      setCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError('No se pudo abrir la cámara. Revisa los permisos del navegador o sube una foto.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) choose(new File([blob], 'pagina.jpg', { type: 'image/jpeg' }));
        stopCamera();
      },
      'image/jpeg',
      0.92,
    );
  };

  const extract = async () => {
    if (!file) return;
    if (!isAuthenticated) {
      onOpenLogin();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await extractOcr(file));
    } catch (err) {
      setError(errorMessage(err, 'No se pudo leer la imagen.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const openInReader = (r: OcrExtractResponse) => {
    const chunkIds = new Map<string, string>();
    r.blocks.forEach((b) => b.sentences.forEach((s) => chunkIds.set(normalizeKey(s.text), s.chunkId)));
    onTextExtracted({ text: r.text, documentId: r.documentId, chunkIds, title: r.originalFilename });
  };

  return (
    <div>
      <PageHeader
        title="Escanear una página"
        lead="Toma una foto de tu libro o ficha. LexiLearn encuentra el texto, quita el ruido del escaneo y lo deja listo para leer."
      />

      {error && (
        <Notice tone="error" className="mb-6">
          {error}
        </Notice>
      )}

      {!file && !camera && (
        <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files[0]);
            }}
            className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-8 text-center ${
              dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent'
            }`}
          >
            <ImageUp className="h-12 w-12 text-accent" aria-hidden />
            <span className="mt-4 text-xl font-semibold">Elige una foto o arrástrala aquí</span>
            <span className="mt-1 text-ink-soft">PNG, JPEG o WebP de hasta 10 MB</span>
            <input
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={(e) => choose(e.target.files?.[0])}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={() => void startCamera()}
            className="flex min-h-64 flex-col items-center justify-center rounded-[20px] border-2 border-line bg-surface-2 p-8 text-center hover:border-accent"
          >
            <Camera className="h-12 w-12 text-accent" aria-hidden />
            <span className="mt-4 text-xl font-semibold">Usar la cámara</span>
            <span className="mt-1 text-ink-soft">Con buena luz y la página plana</span>
          </button>
        </div>
      )}

      {camera && (
        <div className="space-y-4">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-[20px] border-2 border-accent bg-black">
            <video ref={videoRef} playsInline muted className="w-full" />
          </div>
          <div className="flex justify-center gap-3">
            <Button size="lg" icon={<Camera className="h-5 w-5" />} onClick={capture}>
              Tomar la foto
            </Button>
            <Button variant="quiet" size="lg" onClick={stopCamera}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {file && preview && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <img
              src={preview}
              alt="Foto de la página elegida"
              className="max-h-[28rem] w-full rounded-[20px] border border-line bg-surface-2 object-contain"
            />
            <p className="mt-2 truncate text-sm text-ink-soft">
              {file.name}, {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>

          <div>
            {!result ? (
              <div className="space-y-4">
                <p className="text-lg">
                  {isAuthenticated
                    ? 'Cuando estés listo, LexiLearn leerá la foto. Puede tardar unos segundos.'
                    : 'Entra con tu cuenta para leer la foto.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" loading={loading} onClick={() => void extract()}>
                    {loading ? 'Leyendo la foto…' : isAuthenticated ? 'Leer la foto' : 'Entrar y leer la foto'}
                  </Button>
                  <Button variant="ghost" size="lg" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
                    Elegir otra
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold">Texto encontrado</h2>
                <p className="mt-1 text-ink-soft">
                  {result.statistics.paragraphs}{' '}
                  {result.statistics.paragraphs === 1 ? 'párrafo' : 'párrafos'}, {result.statistics.sentences}{' '}
                  oraciones y {result.statistics.words} palabras
                  {result.confidence !== null && `, con una confianza del ${Math.round(result.confidence)} %`}.
                </p>

                <div className="reader-text mt-4 max-h-80 space-y-4 overflow-y-auto rounded-[20px] border border-line bg-surface p-5 text-lg">
                  {result.blocks.map((b) => (
                    <p key={b.index}>{b.text}</p>
                  ))}
                </div>

                {result.confidence !== null && result.confidence < 70 && (
                  <Notice tone="info" className="mt-4">
                    La foto no se veía del todo clara y puede haber palabras mal leídas. Si puedes, toma
                    otra con más luz.
                  </Notice>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => openInReader(result)}>
                    Leer este texto
                  </Button>
                  <Button variant="ghost" size="lg" onClick={reset}>
                    Escanear otra página
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
