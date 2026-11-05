import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Sparkles,
  AlignLeft,
  Divide,
  Eye,
  CheckCircle,
  Pause,
  RotateCcw,
  BookOpen,
  Gauge,
  Clock,
  Sliders,
} from 'lucide-react';
import { processText } from '../api/readingAssistant';
import { synthesizeSpeech } from '../api/tts';
import {
  startReadingSession,
  sendHeartbeat,
  claimReward,
} from '../api/gamification';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import type { ProcessTextResponse, SentenceAnalysis } from '../types/api';
import confetti from 'canvas-confetti';

interface Props {
  initialText?: string;
  documentId?: string;
}

const DEFAULT_SAMPLE_TEXT = `Cuando la lectura se siente grande o difícil, podemos dividirla en partes pequeñas y amigables.

Las palabras tienen ritmos y sílabas que podemos descubrir poco a poco. Si respiramos con calma y enfocamos nuestra atención en una línea a la vez, cada historia se vuelve una aventura hermosa y llena de descubrimientos.`;

export const ReaderView: React.FC<Props> = ({ initialText, documentId }) => {
  const { isAuthenticated, refreshProfile } = useAuth();
  const { preferences, fontClass } = useAccessibility();

  const [rawText, setRawText] = useState(initialText || DEFAULT_SAMPLE_TEXT);
  const [processed, setProcessed] = useState<ProcessTextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View modes
  const [viewMode, setViewMode] = useState<'normal' | 'syllables' | 'chunks'>('normal');
  const [lineFocusActive, setLineFocusActive] = useState(false);
  const [focusedLineIndex, setFocusedLineIndex] = useState(0);

  // TTS playback
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gamification Session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Process text on initial load or change of initialText
  useEffect(() => {
    if (initialText) {
      setRawText(initialText);
      handleProcess(initialText);
    }
  }, [initialText]);

  // Start or resume session when student is authenticated
  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let elapsedSeconds = 0;

    async function initSession() {
      if (isAuthenticated) {
        try {
          const session = await startReadingSession(documentId);
          setSessionId(session.sessionId);

          // Heartbeat every 30 seconds
          heartbeatTimer = setInterval(async () => {
            elapsedSeconds += 30;
            try {
              await sendHeartbeat(session.sessionId, 30, 1, 1);
            } catch (err) {
              console.error('Heartbeat error', err);
            }
          }, 30000);
        } catch (err) {
          console.error('Could not start reading session', err);
        }
      }
    }

    initSession();

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [isAuthenticated, documentId]);

  const handleProcess = async (textToProcess?: string) => {
    const text = textToProcess || rawText;
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await processText({
        text,
        language: 'es',
        options: {
          maxWordsPerChunk: 10,
          wordsPerMinute: Math.round(140 * preferences.speechRate),
        },
      });
      setProcessed(data);
      setCompletedSentences(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el texto');
    } finally {
      setLoading(false);
    }
  };

  // TTS audio synthesize and play
  const handlePlaySentence = async (sentence: SentenceAnalysis, index: number) => {
    try {
      setSynthesizing(true);
      setActiveSentenceIndex(index);

      const res = await synthesizeSpeech({
        text: sentence.text,
        voice: {
          speed: preferences.speechRate,
          pitch: preferences.speechPitch,
        },
      });

      if (audioRef.current) {
        audioRef.current.src = res.signedUrl;
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err: unknown) {
      console.error('TTS error', err);
      setError('No se pudo reproducir el audio. Verifica el servicio de TTS del backend.');
    } finally {
      setSynthesizing(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Gentle celebration
  const triggerCelebration = (msg: string) => {
    setCelebrationMsg(msg);
    if (!preferences.reduceMotion) {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#818cf8', '#34d399', '#f472b6', '#fbbf24'],
        disableForReducedMotion: true,
      });
    }
    setTimeout(() => {
      setCelebrationMsg(null);
    }, 4000);
  };

  // Mark sentence completed
  const handleCompleteSentence = async (index: number) => {
    const newSet = new Set(completedSentences);
    newSet.add(index);
    setCompletedSentences(newSet);

    if (isAuthenticated) {
      try {
        const taskId = `sentence-${sessionId || 'local'}-${index}`;
        const reward = await claimReward(taskId, 'SENTENCE_COMPLETED', sessionId || undefined);
        if (reward.claimed && !reward.alreadyClaimed) {
          triggerCelebration(`¡Buen trabajo! +${reward.xpAwarded} XP ganados`);
          refreshProfile();
        }
      } catch (err) {
        console.error('Reward error', err);
      }
    } else {
      triggerCelebration('¡Oración completada con éxito!');
    }
  };

  // Mark full text completed
  const handleCompleteText = async () => {
    if (isAuthenticated) {
      try {
        const taskId = `page-${sessionId || 'local'}-${Date.now()}`;
        const reward = await claimReward(taskId, 'PAGE_COMPLETED', sessionId || undefined);
        if (reward.claimed) {
          triggerCelebration(`¡Excelente lectura! +${reward.xpAwarded} XP`);
          refreshProfile();
        }
      } catch (err) {
        console.error('Reward error', err);
      }
    } else {
      triggerCelebration('¡Lectura completa finalizada!');
    }
  };

  return (
    <div className={`space-y-6 ${fontClass}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlayingAudio(false);
          setActiveSentenceIndex(null);
        }}
      />

      {/* Celebration Banner */}
      {celebrationMsg && (
        <div className="animate-soft-glow fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-indigo-600 px-5 py-3 text-white shadow-xl">
          <Sparkles className="h-6 w-6 text-amber-300" />
          <span className="font-bold text-sm md:text-base">{celebrationMsg}</span>
        </div>
      )}

      {/* Header controls & Input section if not processed */}
      {!processed ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Ingresa o Pega el Texto a Leer
            </h2>
          </div>

          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Escribe o pega aquí el texto de tu cuento, tarea o libro..."
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-base focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            style={{
              letterSpacing: `${preferences.letterSpacing}em`,
              lineHeight: preferences.lineHeight,
            }}
          />

          {error && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleProcess()}
              disabled={loading || !rawText.trim()}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5" />
              <span>{loading ? 'Analizando fonología...' : 'Comenzar Asistente de Lectura'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRawText(DEFAULT_SAMPLE_TEXT);
                handleProcess(DEFAULT_SAMPLE_TEXT);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cargar texto de ejemplo
            </button>
          </div>
        </div>
      ) : (
        /* Reading Experience Mode */
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* View Mode Selectors */}
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('normal')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  viewMode === 'normal'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <AlignLeft className="h-4 w-4" />
                <span>Normal</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('syllables')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  viewMode === 'syllables'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Divide className="h-4 w-4" />
                <span>Sílabas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('chunks')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  viewMode === 'chunks'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Micro-cláusulas</span>
              </button>
            </div>

            {/* Line Focus Toggle */}
            <button
              type="button"
              onClick={() => setLineFocusActive(!lineFocusActive)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                lineFocusActive
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Regla de Enfoque: {lineFocusActive ? 'Activada' : 'Desactivada'}</span>
            </button>

            {/* Readability Metrics pill */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Gauge className="h-4 w-4 text-emerald-500" />
                Dificultad: {processed.difficulty.score}/100 ({processed.difficulty.level})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-sky-500" />
                ~{processed.readingTime.estimatedMinutes} min ({processed.statistics.words} palabras)
              </span>
            </div>

            {/* Reset / Edit button */}
            <button
              type="button"
              onClick={() => setProcessed(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Cambiar texto</span>
            </button>
          </div>

          {/* Reading Display Area */}
          <div
            className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10 dark:border-slate-800 dark:bg-slate-900"
            style={{
              letterSpacing: `${preferences.letterSpacing}em`,
              lineHeight: preferences.lineHeight,
            }}
          >
            <div className="space-y-6">
              {processed.sentences.map((sentence, sIdx) => {
                const isCurrentActive = activeSentenceIndex === sIdx;
                const isCompleted = completedSentences.has(sIdx);
                const isFocusedLine = !lineFocusActive || Math.abs(focusedLineIndex - sIdx) <= 1;

                return (
                  <div
                    key={sentence.index}
                    onMouseEnter={() => setFocusedLineIndex(sIdx)}
                    className={`group relative rounded-2xl p-4 transition-all duration-200 ${
                      isCurrentActive
                        ? 'bg-indigo-50 ring-2 ring-indigo-400 dark:bg-indigo-950/60'
                        : isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    } ${
                      lineFocusActive && !isFocusedLine
                        ? 'opacity-25 blur-2xs'
                        : 'opacity-100'
                    }`}
                  >
                    {/* Sentence Action floating toolbar */}
                    <div className="mb-2 flex items-center justify-between opacity-80 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-bold text-slate-400">
                        Oración #{sIdx + 1} ({sentence.wordCount} palabras)
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Audio Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrentActive && isPlayingAudio) {
                              toggleAudio();
                            } else {
                              handlePlaySentence(sentence, sIdx);
                            }
                          }}
                          disabled={synthesizing && isCurrentActive}
                          className="flex items-center gap-1 rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300"
                        >
                          {isCurrentActive && isPlayingAudio ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>{synthesizing && isCurrentActive ? 'Generando...' : 'Escuchar'}</span>
                            </>
                          )}
                        </button>

                        {/* Complete Button */}
                        <button
                          type="button"
                          onClick={() => handleCompleteSentence(sIdx)}
                          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{isCompleted ? 'Leída ✓' : 'Marcar Leída'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Rendering by View Mode */}
                    {viewMode === 'normal' && (
                      <p className="text-xl leading-relaxed text-slate-800 dark:text-slate-100">
                        {sentence.text}
                      </p>
                    )}

                    {viewMode === 'syllables' && (
                      <p className="flex flex-wrap gap-x-2 gap-y-1 text-xl leading-relaxed text-slate-800 dark:text-slate-100">
                        {processed.words
                          .filter(
                            (w) =>
                              w.startOffset >= sentence.startOffset &&
                              w.endOffset <= sentence.endOffset
                          )
                          .map((word) => (
                            <span
                              key={word.index}
                              className="inline-flex rounded-md bg-slate-100/70 px-1 dark:bg-slate-800/80"
                            >
                              {word.syllables.map((syl, i) => (
                                <span
                                  key={i}
                                  className={`${
                                    i % 2 === 0
                                      ? 'text-indigo-600 font-bold dark:text-indigo-400'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {syl.text}
                                  {i < word.syllables.length - 1 && (
                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                  )}
                                </span>
                              ))}
                            </span>
                          ))}
                      </p>
                    )}

                    {viewMode === 'chunks' && (
                      <div className="flex flex-wrap gap-2">
                        {sentence.microChunks.map((chunk, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-lg font-medium text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                          >
                            {chunk.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Finalize Button */}
            <div className="mt-10 flex justify-center border-t border-slate-100 pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCompleteText}
                className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg transition-transform hover:bg-emerald-700 active:scale-98"
              >
                <CheckCircle className="h-6 w-6" />
                <span>¡He terminado esta lectura! (Ganar XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
