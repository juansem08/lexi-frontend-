import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  Check,
  Pause,
  PencilLine,
  Play,
  Rows3,
  ScanLine,
  SpellCheck2,
  Volume2,
} from 'lucide-react';
import { processText } from '../api/readingAssistant';
import { claimReward } from '../api/gamification';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useReadingSession } from '../hooks/useReadingSession';
import { useSpeech } from '../hooks/useSpeech';
import {
  DIFFICULTY_LABEL,
  PACING,
  buildSentenceViews,
  formatMinutes,
  normalizeKey,
  shortHash,
  type SentenceView,
} from '../lib/reading';
import { badgeName } from '../lib/badges';
import type { ClaimRewardResponse, ProcessTextResponse } from '../types/api';
import { Button, Notice, Segmented, cx } from './ui';
import { CalmToast } from './CalmToast';

export interface ReaderSource {
  text: string;
  documentId?: string;
  /** Oración normalizada → chunkId del OCR, para pedir el audio por textChunkId. */
  chunkIds?: Map<string, string>;
  title?: string;
}

interface Props {
  source?: ReaderSource;
  onOpenLogin: () => void;
  /** false cuando otra pestaña de la app tapa el lector. */
  isActive?: boolean;
}

type ViewMode = 'text' | 'syllables' | 'chunks';

const SAMPLE_TEXT = `Cuando la lectura se siente grande, podemos dividirla en partes pequeñas.

Las palabras tienen ritmo y sílabas que se descubren poco a poco. Si respiramos con calma y miramos una línea a la vez, cada historia se vuelve más fácil de seguir.`;

function rewardMessage(reward: ClaimRewardResponse, base: string): string | null {
  if (reward.alreadyClaimed) return null;
  const parts = [`${base} +${reward.xpAwarded} XP`];
  if (reward.leveledUp) parts.push(`Ahora estás en el nivel ${reward.progress.level}.`);
  reward.badges.forEach((b) => parts.push(`Nueva insignia: ${badgeName(b.code, b.name)} ${b.icon}`));
  return parts.join(' ');
}

export const ReaderView: React.FC<Props> = ({ source, onOpenLogin, isActive = true }) => {
  const { isAuthenticated, refreshStats } = useAuth();
  const { preferences } = useAccessibility();

  const [rawText, setRawText] = useState(source?.text ?? '');
  const [data, setData] = useState<ProcessTextResponse | null>(null);
  const [active, setActive] = useState<ReaderSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('text');
  const [rulerOn, setRulerOn] = useState(true);
  const [focusIdx, setFocusIdx] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [finished, setFinished] = useState<ClaimRewardResponse | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const textKey = data ? shortHash(data.text) : null;

  const onReward = useCallback(
    (r: ClaimRewardResponse) => {
      const msg = rewardMessage(r, 'Un momento de enfoque.');
      if (msg) setToast(msg);
      void refreshStats();
    },
    [refreshStats],
  );

  const session = useReadingSession({
    enabled: isAuthenticated,
    textKey,
    documentId: active?.documentId,
    paused: !isActive,
    onReward,
  });
  const { speech, play, stop, togglePause, retryApi } = useSpeech(preferences);

  const views = useMemo(() => (data ? buildSentenceViews(data) : []), [data]);
  const windowSize = preferences.lineFocusWindowSize;

  const prepare = useCallback(
    async (src: ReaderSource) => {
      if (!isAuthenticated) {
        onOpenLogin();
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const pacing = PACING[preferences.highlightPacing];
        const res = await processText({
          text: src.text,
          language: 'es',
          options: { maxWordsPerChunk: pacing.maxWords, wordsPerMinute: pacing.wpm },
        });
        stop();
        setData(res);
        setActive(src);
        setDone(new Set());
        setFocusIdx(0);
        setFinished(null);
      } catch (err) {
        setError(errorMessage(err, 'No se pudo preparar el texto.'));
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, onOpenLogin, preferences.highlightPacing, stop],
  );

  // Texto que llega desde el escáner.
  useEffect(() => {
    if (source) {
      setRawText(source.text);
      if (isAuthenticated) void prepare(source);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Teclado: flechas o J/K mueven la regla de lectura.
  useEffect(() => {
    if (!data || !rulerOn) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // El lector sigue montado en otras pestañas: solo actúa si está visible.
      if (!pageRef.current?.offsetParent) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusIdx((i) => Math.min(views.length - 1, i + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, rulerOn, views.length]);

  useEffect(() => {
    if (!rulerOn) return;
    pageRef.current
      ?.querySelector(`[data-sentence="${focusIdx}"]`)
      ?.scrollIntoView({ block: 'center', behavior: preferences.reduceMotion ? 'auto' : 'smooth' });
  }, [focusIdx, rulerOn, preferences.reduceMotion]);

  const listen = (v: SentenceView) => {
    session.recordInteraction();
    if (speech.index === v.sentence.index && (speech.playing || speech.loading)) {
      togglePause();
      return;
    }
    const chunkId = active?.chunkIds?.get(normalizeKey(v.sentence.text));
    void play(v.sentence.index, v.sentence.text, chunkId ? { textChunkId: chunkId } : { text: v.sentence.text });
    setFocusIdx(v.sentence.index);
  };

  const markRead = async (v: SentenceView) => {
    if (done.has(v.sentence.index) || !data) return;
    setDone((prev) => new Set(prev).add(v.sentence.index));
    session.recordChunk();
    if (rulerOn) setFocusIdx(Math.min(views.length - 1, v.sentence.index + 1));
    try {
      const reward = await claimReward(
        'SENTENCE_COMPLETED',
        `sentence:${shortHash(data.text)}:${v.sentence.index}`,
        session.sessionId ?? undefined,
      );
      const msg = rewardMessage(reward, 'Oración leída.');
      if (msg) setToast(msg);
      void refreshStats();
    } catch (err) {
      console.error('No se pudo registrar la oración', err);
    }
  };

  const finish = async () => {
    if (!data) return;
    stop();
    try {
      const page = await claimReward(
        'PAGE_COMPLETED',
        `page:${active?.documentId ?? shortHash(data.text)}`,
        session.sessionId ?? undefined,
      );
      const sessionReward = await session.complete();
      setFinished(sessionReward ?? page);
      void refreshStats();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo registrar la lectura.'));
    }
  };

  // ─── Antes de preparar el texto ───────────────────────────────
  if (!data) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">¿Qué vas a leer hoy?</h1>
          <p className="mt-2 max-w-xl text-lg text-ink-soft">
            Pega un cuento, una tarea o una página. LexiLearn la separa en oraciones, sílabas y partes
            cortas para que la leas a tu ritmo.
          </p>

          <label htmlFor="reader-input" className="sr-only">
            Texto para leer
          </label>
          <textarea
            id="reader-input"
            rows={9}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            maxLength={20000}
            placeholder="Escribe o pega aquí tu texto…"
            className="reader-text mt-6 w-full rounded-[20px] border-2 border-line bg-surface p-5 text-xl text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
          />

          {error && (
            <Notice tone="error" className="mt-4">
              {error}
            </Notice>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              loading={loading}
              disabled={!rawText.trim()}
              onClick={() => void prepare({ text: rawText })}
            >
              {isAuthenticated ? 'Preparar la lectura' : 'Entrar y preparar la lectura'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRawText(SAMPLE_TEXT);
                if (isAuthenticated) void prepare({ text: SAMPLE_TEXT });
              }}
            >
              Probar con un texto de ejemplo
            </Button>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{rawText.length.toLocaleString('es')} de 20.000 caracteres</p>
        </div>

        <aside className="space-y-5 text-ink-soft lg:pt-16">
          <p>
            <strong className="text-ink">Sílabas.</strong> Cada palabra se separa respetando diptongos
            e hiatos del español.
          </p>
          <p>
            <strong className="text-ink">Partes cortas.</strong> Las oraciones largas se dividen en
            bloques de {PACING[preferences.highlightPacing].maxWords} palabras como máximo.
          </p>
          <p>
            <strong className="text-ink">Regla de lectura.</strong> Ilumina {windowSize}{' '}
            {windowSize === 1 ? 'oración' : 'oraciones'} y atenúa el resto.
          </p>
        </aside>
      </div>
    );
  }

  // ─── Lectura ───────────────────────────────────────────────────
  const total = views.length;
  const readCount = done.size;
  const half = Math.floor((windowSize - 1) / 2);
  const winStart = Math.max(0, Math.min(focusIdx - half, total - windowSize));
  const inWindow = (i: number) => i >= winStart && i < winStart + windowSize;

  return (
    <div>
      <CalmToast message={toast} onDone={() => setToast(null)} />

      {/* Herramientas */}
      <div className="no-print sticky top-[4.25rem] z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 lg:-mx-12 lg:px-12">
        <Segmented<ViewMode>
          label="Forma de mostrar el texto"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'text', label: 'Texto', icon: <AlignLeft className="h-4 w-4" /> },
            { id: 'syllables', label: 'Sílabas', icon: <SpellCheck2 className="h-4 w-4" /> },
            { id: 'chunks', label: 'Partes cortas', icon: <Rows3 className="h-4 w-4" /> },
          ]}
        />
        <button
          type="button"
          aria-pressed={rulerOn}
          onClick={() => setRulerOn((v) => !v)}
          className={cx(
            'inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold',
            rulerOn ? 'bg-ruler text-ink' : 'bg-surface-2 text-ink-soft hover:text-ink',
          )}
        >
          <ScanLine className="h-4 w-4" aria-hidden />
          Regla de lectura
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          icon={<PencilLine className="h-4 w-4" />}
          onClick={() => {
            stop();
            setData(null);
          }}
        >
          Cambiar texto
        </Button>
      </div>

      {speech.notice && (
        <Notice tone="info" className="no-print mb-6">
          {speech.notice}{' '}
          <button type="button" onClick={retryApi} className="font-semibold text-accent underline">
            Probar otra vez la voz de la API
          </button>
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-6">
          {error}
        </Notice>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_15rem]">
        {/* Página */}
        <article
          ref={pageRef}
          aria-label={active?.title ?? 'Texto para leer'}
          className="reader-text rounded-[20px] border border-line bg-surface py-6 text-[1.4rem] text-ink sm:py-10"
        >
          {views.map((v) => {
            const i = v.sentence.index;
            const isDone = done.has(i);
            const speaking = speech.index === i;
            const dim = rulerOn && !inWindow(i);
            const lit = rulerOn && inWindow(i);
            return (
              <div
                key={i}
                data-sentence={i}
                onPointerEnter={(e) => {
                  if (rulerOn && e.pointerType === 'mouse') setFocusIdx(i);
                }}
                className={cx(
                  'group ruler-band relative grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-1 px-2 py-2 sm:grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] sm:px-4',
                  v.newParagraph && 'mt-6',
                  lit && 'bg-ruler',
                  dim && 'opacity-35',
                )}
              >
                <button
                  type="button"
                  onClick={() => listen(v)}
                  aria-label={
                    speaking && speech.playing ? `Pausar oración ${i + 1}` : `Escuchar oración ${i + 1}`
                  }
                  className={cx(
                    'mt-0.5 flex h-11 w-11 items-center justify-center rounded-full font-ui',
                    speaking ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:bg-surface-2 hover:text-accent',
                  )}
                >
                  {speaking && speech.loading ? (
                    <Volume2 className="h-5 w-5 animate-pulse" />
                  ) : speaking && speech.playing ? (
                    <Pause className="h-5 w-5" />
                  ) : speaking ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <div className="max-w-[38em] py-1.5">
                  <SentenceBody view={v} mode={mode} speakingChar={speaking ? speech.charIndex : -1} />
                </div>

                <button
                  type="button"
                  onClick={() => void markRead(v)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `Oración ${i + 1} leída` : `Marcar oración ${i + 1} como leída`}
                  className={cx(
                    'mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border-2',
                    isDone
                      ? 'border-moss bg-moss text-accent-ink'
                      : 'border-line text-ink-soft hover:border-moss hover:text-moss',
                  )}
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            );
          })}

          <div className="mx-6 mt-10 border-t border-line pt-8 font-ui sm:mx-10">
            {finished ? (
              <div className="animate-soft-glow rounded-2xl bg-moss-soft p-5">
                <p className="font-[Lexend] text-xl font-semibold">Lectura terminada.</p>
                <p className="mt-1 text-ink-soft">
                  Tienes {finished.progress.totalXp} XP y vas en el nivel {finished.progress.level}. Puedes
                  descansar o empezar otro texto cuando quieras.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="moss" size="lg" onClick={() => void finish()}>
                  Terminé de leer
                </Button>
                <span className="text-ink-soft">No hace falta marcar todas las oraciones.</span>
              </div>
            )}
          </div>
        </article>

        {/* Datos del texto */}
        <aside className="no-print space-y-6 font-ui xl:sticky xl:top-24 xl:self-start">
          <div>
            <p className="text-sm text-ink-soft">Llevas</p>
            <p className="font-[Lexend] text-2xl font-semibold">
              {readCount} de {total} oraciones
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-moss" style={{ width: `${total ? (readCount / total) * 100 : 0}%` }} />
            </div>
          </div>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-ink-soft">Tiempo aproximado</dt>
              <dd className="text-lg">{formatMinutes(data.readingTime.estimatedSeconds)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Palabras</dt>
              <dd className="text-lg">{data.statistics.words}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Dificultad</dt>
              <dd className="text-lg">
                {DIFFICULTY_LABEL[data.difficulty.level]}{' '}
                <span className="text-ink-soft">({Math.round(data.difficulty.score)} de 100)</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Palabras por oración</dt>
              <dd className="text-lg">{data.statistics.averageWordsPerSentence.toFixed(1)}</dd>
            </div>
          </dl>
          {rulerOn && (
            <p className="text-sm text-ink-soft">
              Mueve la regla con las flechas ↑ ↓ del teclado o pasando el ratón.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

const SentenceBody: React.FC<{ view: SentenceView; mode: ViewMode; speakingChar: number }> = ({
  view,
  mode,
  speakingChar,
}) => {
  const { sentence, words } = view;

  if (mode === 'chunks') {
    return (
      <span className="flex flex-col gap-1.5">
        {sentence.microChunks.map((c, i) => (
          <span key={i} className="border-l-4 border-accent/50 pl-3">
            {c.text}
          </span>
        ))}
      </span>
    );
  }

  if (mode === 'syllables') {
    return (
      <span className="flex flex-wrap gap-x-[0.6em] gap-y-1">
        {words.map((w) => (
          <span key={w.index} className="whitespace-nowrap">
            {w.syllables.map((s, i) => (
              <React.Fragment key={i}>
                <span className={i % 2 === 0 ? 'text-ink' : 'text-accent'}>{s.text}</span>
                {i < w.syllables.length - 1 && <span className="text-ink-soft/60">·</span>}
              </React.Fragment>
            ))}
          </span>
        ))}
      </span>
    );
  }

  // Texto normal: resalta la palabra que suena mientras se escucha.
  if (speakingChar < 0) return <span>{sentence.text}</span>;
  const base = sentence.startOffset;
  return (
    <span>
      {words.map((w, i) => {
        const start = w.startOffset - base;
        const end = w.endOffset - base;
        const next = words[i + 1];
        const tail = next ? sentence.text.slice(end, next.startOffset - base) : sentence.text.slice(end);
        const lead = i === 0 ? sentence.text.slice(0, start) : '';
        const current = speakingChar >= start && (next ? speakingChar < next.startOffset - base : true);
        return (
          <React.Fragment key={w.index}>
            {lead}
            <span className={current ? 'rounded bg-accent px-0.5 text-accent-ink' : undefined}>
              {sentence.text.slice(start, end)}
            </span>
            {tail}
          </React.Fragment>
        );
      })}
    </span>
  );
};
