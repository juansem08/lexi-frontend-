import React, { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../api/client';
import { Server, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setStatus('checking');
    setStatusMsg('');
    try {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const healthUrl = cleanUrl.endsWith('/api/v1')
        ? `${cleanUrl}/health`
        : `${cleanUrl}/api/v1/health`;

      const res = await fetch(healthUrl, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setStatusMsg(`Conexión exitosa con la API (${data.status || 'OK'})`);
      } else {
        setStatus('error');
        setStatusMsg(`El servidor respondió con código ${res.status}`);
      }
    } catch {
      setStatus('error');
      setStatusMsg('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
    }
  };

  const handleSave = () => {
    setApiBaseUrl(url.trim());
    onClose();
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:3000/api/v1';
    setUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Configuración de la API
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Define la dirección del backend de LexiLearn. Por defecto conecta a tu entorno local y puedes cambiarlo fácilmente cuando lo despliegues a la nube.
        </p>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            URL Base de la API:
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setStatus('idle');
            }}
            placeholder="http://localhost:3000/api/v1"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {status === 'success' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={status === 'checking'}
            className="w-full rounded-xl bg-slate-100 py-2.5 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {status === 'checking' ? 'Probando conexión...' : 'Probar Conexión (/health)'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white shadow-md hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
