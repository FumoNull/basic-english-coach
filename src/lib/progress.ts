import type { Activity, ProgressState } from "../types";

export const STORAGE_KEY = "basic-english-coach-progress-v1";
const COURSE_DAYS = 84;

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(from: string, to: string) {
  const fromTime = new Date(`${from}T00:00:00`).getTime();
  const toTime = new Date(`${to}T00:00:00`).getTime();
  return Math.round((toTime - fromTime) / 86_400_000);
}

export function createInitialProgress(): ProgressState {
  return {
    currentDay: 1,
    completedActivities: [],
    wordMastery: {},
    mistakes: {},
    streak: 0,
    lastStudyDate: null,
  };
}

export function loadProgress(): ProgressState {
  if (typeof localStorage === "undefined") {
    return createInitialProgress();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialProgress();
  }

  try {
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      ...createInitialProgress(),
      ...parsed,
      currentDay: Math.min(Math.max(parsed.currentDay ?? 1, 1), COURSE_DAYS),
    };
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

function touchStreak(progress: ProgressState, date = todayKey()) {
  if (progress.lastStudyDate === date) {
    return progress.streak || 1;
  }

  if (progress.lastStudyDate && daysBetween(progress.lastStudyDate, date) === 1) {
    return progress.streak + 1;
  }

  return 1;
}

export function updateAfterAttempt(
  progress: ProgressState,
  activity: Activity,
  focusWords: string[],
  correct: boolean
): ProgressState {
  const date = todayKey();
  const completedActivities =
    correct && !progress.completedActivities.includes(activity.id)
      ? [...progress.completedActivities, activity.id]
      : progress.completedActivities;

  const wordMastery = { ...progress.wordMastery };
  for (const word of focusWords) {
    const current = wordMastery[word] ?? { seen: 0, correct: 0, lastSeen: date };
    wordMastery[word] = {
      seen: current.seen + 1,
      correct: current.correct + (correct ? 1 : 0),
      lastSeen: date,
    };
  }

  const mistakes = { ...progress.mistakes };
  if (!correct) {
    mistakes[activity.answer] = (mistakes[activity.answer] ?? 0) + 1;
  }

  return {
    ...progress,
    completedActivities,
    wordMastery,
    mistakes,
    streak: touchStreak(progress, date),
    lastStudyDate: date,
  };
}

export function advanceDay(progress: ProgressState): ProgressState {
  return {
    ...progress,
    currentDay: Math.min(progress.currentDay + 1, COURSE_DAYS),
  };
}

export function resetProgress() {
  const progress = createInitialProgress();
  saveProgress(progress);
  return progress;
}
