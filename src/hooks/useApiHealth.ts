import { useCallback, useEffect, useState } from 'react';
import { API_URL_CHANGED_EVENT } from '../api/client';
import { checkHealth, type HealthState } from '../api/health';

/** Consulta GET /health al cargar, cada minuto y al cambiar la URL de la API. */
export function useApiHealth() {
  const [state, setState] = useState<HealthState | null>(null);

  const refresh = useCallback(async () => {
    setState(await checkHealth());
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 60_000);
    window.addEventListener(API_URL_CHANGED_EVENT, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener(API_URL_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  return { state, refresh };
}
