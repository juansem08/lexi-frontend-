// Catálogo de insignias del backend (src/modules/gamification/reward-catalog.ts).
// La API devuelve nombres en inglés; aquí se muestran en español con el mismo código.
export const BADGE_CATALOG: Array<{
  code: string;
  icon: string;
  name: string;
  description: string;
  howTo: string;
}> = [
  {
    code: 'FIRST_STEP',
    icon: '🌱',
    name: 'Primer paso',
    description: 'Completaste tu primer momento de lectura. Con eso basta.',
    howTo: 'Marca tu primera oración como leída.',
  },
  {
    code: 'SENTENCE_EXPLORER',
    icon: '✨',
    name: 'Exploración de oraciones',
    description: 'Exploraste cinco oraciones a tu ritmo.',
    howTo: 'Marca cinco oraciones como leídas.',
  },
  {
    code: 'PAGE_WANDERER',
    icon: '📖',
    name: 'Paseo de páginas',
    description: 'Leíste cinco páginas, un paso tranquilo cada vez.',
    howTo: 'Termina cinco textos o páginas.',
  },
  {
    code: 'FOCUS_SPARK',
    icon: '🫧',
    name: 'Chispa de enfoque',
    description: 'Encontraste diez pequeños momentos de concentración.',
    howTo: 'Lee con calma: cada 5 minutos de lectura suma un momento.',
  },
  {
    code: 'STEADY_READER',
    icon: '🍃',
    name: 'Lectura constante',
    description: 'Volviste a leer en tres días distintos.',
    howTo: 'Lee en tres días diferentes. No tienen que ser seguidos.',
  },
  {
    code: 'CALM_FINISHER',
    icon: '🌙',
    name: 'Final sereno',
    description: 'Completaste tres sesiones de lectura sin presión.',
    howTo: 'Termina tres sesiones de lectura.',
  },
];

export function badgeName(code: string, fallback: string): string {
  return BADGE_CATALOG.find((b) => b.code === code)?.name ?? fallback;
}
