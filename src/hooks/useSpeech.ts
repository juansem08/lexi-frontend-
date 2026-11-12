import { useCallback, useEffect, useRef, useState } from 'react';
import { synthesizeSpeech, type SynthesizeSource } from '../api/tts';
import { errorMessage } from '../api/client';
import type { AccessibilityPreferences } from '../types/api';

export type SpeechEngine = 'api' | 'browser';

export interface SpeechState {
  index: number | null;
  loading: boolean;
  playing: boolean;
  /** Carácter aproximado que se está leyendo dentro de la oración. */
  charIndex: number;
  engine: SpeechEngine | null;
  notice: string | null;
}

const IDLE: SpeechState = {
  index: null,
  loading: false,
  playing: false,
  charIndex: -1,
  engine: null,
  notice: null,
};

/**
 * Voz con POST /tts/synthesize (URL MP3 firmada y en caché).
 * Si la API no tiene un proveedor de voz disponible, usa la voz del navegador
 * para que el estudiante no se quede sin audio.
 */
export function useSpeech(prefs: AccessibilityPreferences) {
  const [state, setState] = useState<SpeechState>(IDLE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textRef = useRef('');
  const apiUnavailable = useRef(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setState((s) => ({ ...IDLE, notice: s.notice }));
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => {
      if (!audio.duration || !isFinite(audio.duration)) return;
      const ratio = audio.currentTime / audio.duration;
      setState((s) => ({ ...s, charIndex: Math.floor(ratio * textRef.current.length) }));
    };
    const onEnd = () => setState((s) => ({ ...IDLE, notice: s.notice }));
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakWithBrowser = useCallback(
    (index: number, text: string, notice: string | null) => {
      if (!('speechSynthesis' in window)) {
        setState({ ...IDLE, notice: notice ?? 'Este navegador no puede leer en voz alta.' });
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES';
      u.rate = prefs.speechRate;
      u.pitch = prefs.speechPitch;
      u.onboundary = (e) => setState((s) => ({ ...s, charIndex: e.charIndex }));
      u.onend = () => setState((s) => ({ ...IDLE, notice: s.notice }));
      u.onerror = () => setState((s) => ({ ...IDLE, notice: s.notice }));
      setState({ index, loading: false, playing: true, charIndex: 0, engine: 'browser', notice });
      window.speechSynthesis.speak(u);
    },
    [prefs.speechRate, prefs.speechPitch],
  );

  const play = useCallback(
    async (index: number, text: string, source: SynthesizeSource) => {
      stop();
      textRef.current = text;
      if (apiUnavailable.current) {
        speakWithBrowser(index, text, 'Usando la voz del navegador.');
        return;
      }
      setState({ ...IDLE, index, loading: true });
      try {
        const res = await synthesizeSpeech(source, {
          persona: prefs.ttsVoicePersona,
          speed: prefs.speechRate,
          pitch: prefs.speechPitch,
        });
        const audio = audioRef.current;
        if (!audio) return;
        audio.src = res.signedUrl;
        await audio.play();
        setState({ index, loading: false, playing: true, charIndex: 0, engine: 'api', notice: null });
      } catch (err) {
        apiUnavailable.current = true;
        speakWithBrowser(
          index,
          text,
          `${errorMessage(err, 'La voz de la API no está disponible.')} Usando la voz del navegador.`,
        );
      }
    },
    [prefs.ttsVoicePersona, prefs.speechRate, prefs.speechPitch, speakWithBrowser, stop],
  );

  const togglePause = useCallback(() => {
    if (state.engine === 'api' && audioRef.current) {
      if (audioRef.current.paused) void audioRef.current.play();
      else audioRef.current.pause();
    } else if (state.engine === 'browser') {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
    }
    setState((s) => ({ ...s, playing: !s.playing }));
  }, [state.engine]);

  /** Vuelve a intentar la voz de la API en la próxima reproducción. */
  const retryApi = useCallback(() => {
    apiUnavailable.current = false;
    setState((s) => ({ ...s, notice: null }));
  }, []);

  return { speech: state, play, stop, togglePause, retryApi };
}
