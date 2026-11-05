import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { extractOcr } from '../api/ocr';
import type { OcrExtractResponse } from '../types/api';

interface Props {
  onTextExtracted: (text: string, documentId: string) => void;
}

export const OcrUploader: React.FC<Props> = ({ onTextExtracted }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Webcam capture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen no debe superar los 10 MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setResult(null);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError('No se pudo acceder a la cámara. Por favor permite los permisos.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], 'captura-libro.png', {
              type: 'image/png',
            });
            setSelectedFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            stopCamera();
          }
        }, 'image/png');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleUploadOcr = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await extractOcr(selectedFile);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar OCR de la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Escáner OCR de Textos y Libros
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sube o toma una foto a la página de tu libro, guía o ficha de estudio. El sistema extraerá el texto, limpiará el ruido y lo adaptará para lectura asistida.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Camera section */}
        {isCameraActive && (
          <div className="mb-6 space-y-4">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border-2 border-indigo-400 bg-black shadow-lg">
              <video ref={videoRef} className="w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700"
              >
                <Camera className="h-5 w-5" />
                <span>Capturar Foto</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-2xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Upload Dropzone */}
        {!isCameraActive && !previewUrl && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600">
              <UploadCloud className="mb-3 h-12 w-12 text-indigo-500" />
              <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                Seleccionar o arrastrar imagen
              </span>
              <span className="mt-1 text-xs text-slate-400">
                PNG, JPEG o WebP (hasta 10 MB)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={startCamera}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-100/50 dark:border-indigo-900 dark:bg-indigo-950/30 dark:hover:border-indigo-700"
            >
              <Camera className="mb-3 h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-bold text-indigo-900 dark:text-indigo-200">
                Tomar foto con la cámara
              </span>
              <span className="mt-1 text-xs text-indigo-500/80 dark:text-indigo-400/70">
                Apunta al libro o página física
              </span>
            </button>
          </div>
        )}

        {/* Image Preview & Upload Button */}
        {previewUrl && !result && (
          <div className="space-y-4">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-2 shadow-inner dark:border-slate-700 dark:bg-slate-800">
              <img
                src={previewUrl}
                alt="Vista previa escaneo"
                className="h-64 w-full rounded-2xl object-contain"
              />
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleUploadOcr}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-5 w-5" />
                <span>{loading ? 'Extrayendo texto con OCR...' : 'Procesar Imagen con OCR'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Otra imagen</span>
              </button>
            </div>
          </div>
        )}

        {/* Extraction Results */}
        {result && (
          <div className="mt-6 space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-bold">¡Texto extraído con éxito!</h3>
              </div>
              <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {result.wordCount} palabras / {result.sentenceCount} oraciones / {result.processingMs} ms
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <p className="line-clamp-4 text-base leading-relaxed">
                {result.normalizedText}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onTextExtracted(result.normalizedText, result.documentId)}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700"
              >
                <span>Abrir en Lector Asistivo</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300"
              >
                Escanear otra página
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
