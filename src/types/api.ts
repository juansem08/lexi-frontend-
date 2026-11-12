// Contratos que reflejan los DTOs de LexiLearn-Backend (src/modules/**/dto).

// ─── Enums (Prisma) ──────────────────────────────────────────────
export type FontFamily =
  | 'OPEN_DYSLEXIC'
  | 'ATKINSON_HYPERLEGIBLE'
  | 'VERDANA'
  | 'ARIAL'
  | 'COMIC_SANS';

export type ContrastMode = 'LIGHT' | 'DARK' | 'PASTEL' | 'HIGH_CONTRAST';

export type TtsVoicePersona = 'CHILD_FRIENDLY' | 'CALM_NARRATOR' | 'NEURAL_FRIENDLY';

export type HighlightPacing = 'SLOW' | 'BALANCED' | 'FAST';

export type ReadingSessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export type RewardTaskType =
  | 'SENTENCE_COMPLETED'
  | 'PAGE_COMPLETED'
  | 'SESSION_COMPLETED'
  | 'FOCUS_MILESTONE';

export type ReadingLanguage = 'es' | 'en';

export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'advanced';

// ─── Health ──────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  database: string;
  uptimeSeconds: number;
  version: string;
  timestamp: string;
}

// ─── Students ────────────────────────────────────────────────────
export interface AccessibilityPreferences {
  preferredFont: FontFamily;
  letterSpacing: number;
  lineHeight: number;
  contrastMode: ContrastMode;
  lineFocusWindowSize: number;
  ttsVoicePersona: TtsVoicePersona;
  speechRate: number;
  speechPitch: number;
  highlightPacing: HighlightPacing;
  reduceMotion: boolean;
  soundEffects: boolean;
}

export interface StudentProfile {
  id: string;
  studentCode: string;
  displayName: string;
  gradeLevel: number;
  classroomCode: string | null;
  accessibility: AccessibilityPreferences;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ProvisionedStudentResponse extends StudentProfile {
  qrToken: string;
  qrTokenExpiresAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  student: StudentProfile;
}

export interface QrTokenResponse {
  qrToken: string;
  studentCode: string;
  expiresAt: string;
  expiresIn: number;
}

export interface VisualTokenResponse {
  message: string;
  visualTokenConfigured: boolean;
}

export interface PinChangedResponse {
  message: string;
}

// ─── Reading assistant ───────────────────────────────────────────
export interface Syllable {
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface WordSyllables {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
  syllableCount: number;
  syllables: Syllable[];
}

export interface MicroChunk {
  text: string;
  startOffset: number;
  endOffset: number;
  startWordIndex: number;
  endWordIndex: number;
  wordCount: number;
  estimatedSeconds: number;
}

export interface SentenceAnalysis {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
  wordCount: number;
  estimatedSeconds: number;
  microChunks: MicroChunk[];
}

export interface ProcessTextResponse {
  language: ReadingLanguage;
  text: string;
  statistics: {
    characters: number;
    words: number;
    sentences: number;
    paragraphs: number;
    averageWordsPerSentence: number;
  };
  readingTime: {
    estimatedSeconds: number;
    estimatedMinutes: number;
    wordsPerMinute: number;
  };
  difficulty: {
    score: number;
    level: DifficultyLevel;
    fleschReadingEase: number;
    averageSentenceLength: number;
    averageSyllablesPerWord: number;
    polysyllabicWordPercentage: number;
  };
  chunking: {
    maxWordsPerChunk: number;
    strategy: string;
  };
  sentences: SentenceAnalysis[];
  words: WordSyllables[];
}

// ─── OCR ─────────────────────────────────────────────────────────
export interface OcrWord {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface OcrSentence {
  chunkId: string;
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
  wordCount: number;
  words: OcrWord[];
}

export interface OcrParagraph {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
  sentenceCount: number;
  sentences: OcrSentence[];
}

export interface OcrExtractResponse {
  documentId: string;
  provider: string;
  confidence: number | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  text: string;
  statistics: {
    paragraphs: number;
    sentences: number;
    words: number;
    characters: number;
    processingMs: number;
  };
  blocks: OcrParagraph[];
}

// ─── TTS ─────────────────────────────────────────────────────────
export interface SynthesizeSpeechResponse {
  assetId: string;
  textChunkId: string | null;
  text: string;
  provider: string;
  voiceId: string;
  speed: number;
  pitch: number;
  mimeType: string;
  signedUrl: string;
  expiresAt: string;
  cached: boolean;
  characterCount: number;
  durationMs: number | null;
}

// ─── Gamification ────────────────────────────────────────────────
export interface FocusSummary {
  currentStreak: number;
  bestStreak: number;
  focusDays: number;
  message: string;
}

export interface ProgressSummary {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgressPercent: number;
}

export interface EarnedBadge {
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface StartSessionResponse {
  sessionId: string;
  documentId: string | null;
  status: ReadingSessionStatus;
  startedAt: string;
  resumed: boolean;
  gentleMessage: string;
}

export interface HeartbeatResponse {
  sessionId: string;
  status: ReadingSessionStatus;
  durationSeconds: number;
  chunksProcessed: number;
  interactions: number;
  lastHeartbeatAt: string;
  accepted: { activeSeconds: number; chunksProcessed: number; interactions: number };
  focus: FocusSummary;
  gentleMessage: string;
}

export interface ClaimRewardResponse {
  claimId: string;
  taskType: RewardTaskType;
  taskId: string;
  xpAwarded: number;
  alreadyClaimed: boolean;
  leveledUp: boolean;
  sessionCompleted: boolean;
  progress: ProgressSummary;
  focus: FocusSummary;
  badges: EarnedBadge[];
  celebration: { message: string; animation: string; soundCue: string | null };
}

export interface StudentStatsResponse {
  studentId: string;
  displayName: string;
  totalReadingSeconds: number;
  totalReadingMinutes: number;
  textsProcessed: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  chunksProcessed: number;
  interactions: number;
  progress: ProgressSummary;
  focus: FocusSummary;
  rewards: {
    sentences: number;
    pages: number;
    focusMilestones: number;
    sessions: number;
    totalClaims: number;
  };
  badges: EarnedBadge[];
  generatedAt: string;
}

// ─── Errors ──────────────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string[] | string;
}
