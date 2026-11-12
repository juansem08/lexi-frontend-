import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getApiBaseUrl, getDefaultApiBaseUrl, getDocsUrl, setApiBaseUrl } from '../api/client';
import { checkHealth, type HealthState } from '../api/health';
import { Modal } from './Modal';
import { Button, Field, Notice, inputClass } from './ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<HealthState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setResult(null);
    }
  }, [isOpen]);

  const test = async () => {
    setChecking(true);
    setResult(await checkHealth(url));
    setChecking(false);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Conexión con la API"
      description="Dirección del backend LexiLearn, incluido el prefijo /api/v1."
    >
      <div className="space-y-4">
        <Field label="URL base" htmlFor="api-url" hint={`Predeterminada: ${getDefaultApiBaseUrl()}`}>
          <input
            id="api-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setResult(null);
            }}
            spellCheck={false}
            className={`${inputClass} font-mono text-base`}
          />
        </Field>

        {result?.kind === 'ok' && (
          <Notice tone="success">
            Conectado. API versión {result.data.version}, base de datos {result.data.database === 'up' ? 'activa' : result.data.database}.
          </Notice>
        )}
        {result?.kind === 'degraded' && <Notice tone="error">{result.message}</Notice>}
        {result?.kind === 'offline' && (
          <Notice tone="error">
            No hay respuesta en esa dirección. Arranca el backend con <code>npm run start:dev</code> y
            revisa que <code>CORS_ORIGINS</code> incluya {window.location.origin}.
          </Notice>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="quiet" loading={checking} onClick={() => void test()}>
            Probar conexión
          </Button>
          <Button
            onClick={() => {
              setApiBaseUrl(url);
              onClose();
            }}
            disabled={!url.trim()}
          >
            Guardar dirección
          </Button>
          <Button variant="ghost" onClick={() => setUrl(getDefaultApiBaseUrl())}>
            Usar la predeterminada
          </Button>
        </div>

        <a
          href={getDocsUrl()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-accent underline-offset-4 hover:underline"
        >
          Abrir la documentación Swagger
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </Modal>
  );
};
