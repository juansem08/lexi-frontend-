export type FontFamily =
  | 'OPEN_DYSLEXIC'
  | 'ATKINSON_HYPERLEGIBLE'
  | 'VERDANA'
  | 'ARIAL'
  | 'COMIC_SANS';

export type ContrastMode = 'LIGHT' | 'DARK' | 'PASTEL' | 'HIGH_CONTRAST';

export type TtsVoicePersona =
  | 'CHILD_FRIENDLY'
  | 'CALM_NARRATOR'
  | 'NEURAL_FRIENDLY';

export type HighlightPacing = 'SLOW' | 'BALANCED' | 'FAST';

export type ReadingSessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export type RewardTaskType =
  | 'SENTENCE_COMPLETED'
  | 'PAGE_COMPLETED'
  | 'SESSION_COMPLETED'
  | 'FOCUS_MILESTONE';

export type ReadingLanguage = 'es' | 'en';

export type DifficultyLevel =
  | 'VERY_EASY'
  | 'EASY'
  | 'MODERATE'
  | 'CHALLENGING'
  | 'ADVANCED';
