// Enums matching LexiLearn backend
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

// Student & Accessibility Preferences
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

export interface StudentProgress {
  totalXp: number;
  level: number;
  currentFocusStreak: number;
  bestFocusStreak: number;
  totalFocusDays: number;
  lastActiveDate: string | null;
}

export interface StudentProfile extends AccessibilityPreferences {
  id: string;
  studentCode: string;
  displayName: string;
  gradeLevel: number;
  classroomCode?: string | null;
  qrTokenVersion: number;
  lastLoginAt?: string | null;
  progress?: StudentProgress | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  student: StudentProfile;
}

export interface ProvisionedStudentResponse {
  student: StudentProfile;
  qrToken: string;
  message: string;
}

// Reading Assistant
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

export interface ReadingStatistics {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  averageWordsPerSentence: number;
}

export interface ReadingTime {
  estimatedSeconds: number;
  estimatedMinutes: number;
  wordsPerMinute: number;
}

export interface DifficultyAssessment {
  score: number;
  level: DifficultyLevel;
  fleschReadingEase: number;
  averageSentenceLength: number;
  averageSyllablesPerWord: number;
  polysyllabicWordPercentage: number;
}

export interface ProcessTextResponse {
  language: ReadingLanguage;
  text: string;
  words: WordSyllables[];
  sentences: SentenceAnalysis[];
  readingTime: ReadingTime;
  statistics: ReadingStatistics;
  difficulty: DifficultyAssessment;
  chunking: {
    maxWordsPerChunk: number;
    strategy: string;
  };
}

// OCR
export interface OcrParagraphBlock {
  paragraphIndex: number;
  text: string;
  sentenceCount: number;
  wordCount: number;
  startOffset: number;
  endOffset: number;
}

export interface OcrChunkRef {
  id: string;
  order: number;
  text: string;
  wordCount: number;
  startOffset: number;
  endOffset: number;
}

export interface OcrExtractResponse {
  documentId: string;
  originalFilename: string;
  provider: string;
  confidence: number | null;
  processingMs: number;
  normalizedText: string;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  paragraphs: OcrParagraphBlock[];
  chunks: OcrChunkRef[];
}

// TTS
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

// Gamification
export interface StartSessionResponse {
  sessionId: string;
  studentId: string;
  documentId?: string | null;
  status: ReadingSessionStatus;
  startedAt: string;
  resumed: boolean;
}

export interface HeartbeatResponse {
  sessionId: string;
  durationSeconds: number;
  totalXp: number;
  currentFocusStreak: number;
  totalFocusDays: number;
  recorded: boolean;
}

export interface CelebrationResponse {
  animation: string;
  soundCue: string | null;
  message: string;
}

export interface ClaimRewardResponse {
  claimed: boolean;
  alreadyClaimed: boolean;
  taskId: string;
  taskType: RewardTaskType;
  xpAwarded: number;
  totalXp: number;
  newLevel?: number | null;
  celebration?: CelebrationResponse | null;
}

export interface StudentBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface StudentStatsResponse {
  studentId: string;
  displayName: string;
  studentCode: string;
  totalXp: number;
  level: number;
  currentFocusStreak: number;
  bestFocusStreak: number;
  totalFocusDays: number;
  lastActiveDate: string | null;
  badges: StudentBadge[];
  recentSessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number;
    chunksProcessed: number;
    interactions: number;
  }>;
}

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string | string[];
}
