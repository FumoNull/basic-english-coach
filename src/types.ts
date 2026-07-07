export type WordCategory = "operator" | "thing" | "quality" | "action" | "general";

export interface BasicWord {
  id: string;
  word: string;
  category: WordCategory;
  level: number;
  zh: string;
  examples: string[];
  allowedForms: string[];
}

export interface VocabularyItem {
  word: string;
  zh: string;
  category: WordCategory;
  forms: string[];
  example: string;
  exampleZh: string;
}

export type ActivityType = "listen" | "vocabulary" | "choose" | "arrange" | "spell" | "translate" | "speak" | "review";

export interface Activity {
  id: string;
  type: ActivityType;
  prompt: string;
  answer: string;
  choices?: string[];
  words?: string[];
  targetWords?: string[];
  vocabItems?: VocabularyItem[];
  hints: string[];
  scoringRule: "exact" | "word-order" | "basic-compliance" | "self-check";
}

export interface Lesson {
  id: string;
  day: number;
  week: number;
  title: string;
  theme: string;
  focusWords: string[];
  patterns: string[];
  activities: Activity[];
  reviewRefs: string[];
}

export interface WordMastery {
  seen: number;
  correct: number;
  lastSeen: string;
}

export interface ProgressState {
  currentDay: number;
  completedActivities: string[];
  wordMastery: Record<string, WordMastery>;
  mistakes: Record<string, number>;
  studyDates: string[];
  streak: number;
  lastStudyDate: string | null;
  updatedAt: string | null;
}

export interface AttemptResult {
  score: number;
  correct: boolean;
  missingWords: string[];
  extraWords: string[];
  nonBasicWords: string[];
  isBasicCompliant: boolean;
  feedback: string;
  nextStep: string;
}
