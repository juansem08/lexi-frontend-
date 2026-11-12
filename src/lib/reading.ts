import type {
  DifficultyLevel,
  HighlightPacing,
  ProcessTextResponse,
  SentenceAnalysis,
  WordSyllables,
} from '../types/api';

/** Hash estable y corto para construir taskId idempotentes (máx. 120 caracteres). */
export function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function normalizeKey(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  easy: 'Fácil',
  moderate: 'Intermedio',
  challenging: 'Exigente',
  advanced: 'Avanzado',
};

/** El ritmo elegido por el estudiante ajusta tiempo estimado y tamaño de las partes. */
export const PACING: Record<HighlightPacing, { wpm: number; maxWords: number; label: string }> = {
  SLOW: { wpm: 110, maxWords: 6, label: 'Pausado' },
  BALANCED: { wpm: 150, maxWords: 9, label: 'Equilibrado' },
  FAST: { wpm: 190, maxWords: 12, label: 'Ágil' },
};

export interface SentenceView {
  sentence: SentenceAnalysis;
  words: WordSyllables[];
  /** Empieza un párrafo nuevo (hay un salto de línea antes en el texto). */
  newParagraph: boolean;
}

export function buildSentenceViews(data: ProcessTextResponse): SentenceView[] {
  let w = 0;
  return data.sentences.map((sentence, i) => {
    const words: WordSyllables[] = [];
    while (w < data.words.length && data.words[w].startOffset < sentence.startOffset) w++;
    let j = w;
    while (j < data.words.length && data.words[j].endOffset <= sentence.endOffset) {
      words.push(data.words[j]);
      j++;
    }
    w = j;
    const prevEnd = i === 0 ? 0 : data.sentences[i - 1].endOffset;
    const gap = data.text.slice(prevEnd, sentence.startOffset);
    return { sentence, words, newParagraph: i > 0 && gap.includes('\n') };
  });
}

export function formatMinutes(seconds: number): string {
  if (seconds < 60) return 'menos de 1 minuto';
  const m = Math.round(seconds / 60);
  return m === 1 ? '1 minuto' : `${m} minutos`;
}
