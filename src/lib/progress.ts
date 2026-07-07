import type { Activity, ProgressState, WordMastery } from "../types";

export const STORAGE_KEY = "basic-english-coach-progress-v1";
const COURSE_DAYS = 84;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TRANSFER_PREFIX = "BEC1";

interface ProgressTransferPayload {
  app: "basic-english-coach";
  version: 1;
  exportedAt: string;
  progress: ProgressState;
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowIso() {
  return new Date().toISOString();
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value);
}

function addDays(date: string, offset: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + offset);
  return todayKey(next);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0)));
}

function uniqueDateKeys(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(isDateKey))).sort();
}

function latestDateKey(values: Array<string | null | undefined>) {
  const dates = uniqueDateKeys(values);
  return dates.length > 0 ? dates[dates.length - 1] : null;
}

function expandDatesFromStreak(lastStudyDate: string | null | undefined, streak: unknown) {
  if (!isDateKey(lastStudyDate)) {
    return [];
  }

  const count = Math.max(1, Math.floor(Number(streak) || 1));
  return Array.from({ length: count }, (_, index) => addDays(lastStudyDate, -index));
}

function calculateStreak(studyDates: string[], anchorDate = latestDateKey(studyDates)) {
  if (!anchorDate) {
    return 0;
  }

  const dateSet = new Set(studyDates);
  let streak = 0;
  let cursor = anchorDate;

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function normalizeWordMastery(input: unknown): Record<string, WordMastery> {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: Record<string, WordMastery> = {};
  for (const [word, rawValue] of Object.entries(input)) {
    if (!word || !rawValue || typeof rawValue !== "object") {
      continue;
    }

    const value = rawValue as Partial<WordMastery>;
    const seen = Math.max(0, Math.floor(Number(value.seen) || 0));
    const correct = Math.min(seen, Math.max(0, Math.floor(Number(value.correct) || 0)));
    result[word] = {
      seen,
      correct,
      lastSeen: isDateKey(value.lastSeen) ? value.lastSeen : todayKey(),
    };
  }

  return result;
}

function normalizeMistakes(input: unknown) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [answer, rawCount] of Object.entries(input)) {
    const count = Math.max(0, Math.floor(Number(rawCount) || 0));
    if (answer && count > 0) {
      result[answer] = count;
    }
  }

  return result;
}

export function createInitialProgress(): ProgressState {
  return {
    currentDay: 1,
    completedActivities: [],
    wordMastery: {},
    mistakes: {},
    studyDates: [],
    streak: 0,
    lastStudyDate: null,
    updatedAt: null,
  };
}

export function normalizeProgress(progress: Partial<ProgressState> | null | undefined): ProgressState {
  if (!progress) {
    return createInitialProgress();
  }

  const rawStudyDates = Array.isArray(progress.studyDates) ? progress.studyDates : [];
  const migratedStudyDates =
    rawStudyDates.length > 0 ? rawStudyDates : expandDatesFromStreak(progress.lastStudyDate, progress.streak);
  const studyDates = uniqueDateKeys([...migratedStudyDates, progress.lastStudyDate]);
  const lastStudyDate = latestDateKey(studyDates);
  const rawCurrentDay = Number(progress.currentDay);
  const currentDay = Number.isFinite(rawCurrentDay)
    ? Math.min(Math.max(Math.floor(rawCurrentDay), 1), COURSE_DAYS)
    : 1;

  return {
    currentDay,
    completedActivities: Array.isArray(progress.completedActivities)
      ? uniqueStrings(progress.completedActivities)
      : [],
    wordMastery: normalizeWordMastery(progress.wordMastery),
    mistakes: normalizeMistakes(progress.mistakes),
    studyDates,
    streak: calculateStreak(studyDates, lastStudyDate),
    lastStudyDate,
    updatedAt: typeof progress.updatedAt === "string" ? progress.updatedAt : null,
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
    return normalizeProgress(JSON.parse(raw) as Partial<ProgressState>);
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

function touchStudyDate(progress: ProgressState, date = todayKey()) {
  const studyDates = uniqueDateKeys([...progress.studyDates, date]);
  const lastStudyDate = latestDateKey(studyDates);
  return {
    ...progress,
    studyDates,
    streak: calculateStreak(studyDates, lastStudyDate),
    lastStudyDate,
  };
}

function markUpdated(progress: ProgressState) {
  return {
    ...progress,
    updatedAt: nowIso(),
  };
}

function bytesToBinary(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return binary;
}

function binaryToBytes(binary: string) {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  return btoa(bytesToBinary(bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return new TextDecoder().decode(binaryToBytes(atob(padded)));
}

function getPayloadFromTransferCode(code: string): ProgressTransferPayload {
  const compactCode = code.trim().replace(/\s+/g, "");
  const payloadCode = compactCode.startsWith(`${TRANSFER_PREFIX}.`)
    ? compactCode.slice(TRANSFER_PREFIX.length + 1)
    : compactCode;

  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(payloadCode)) as unknown;
  } catch {
    throw new Error("进度码无法识别，请确认复制完整。");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("进度码内容为空。");
  }

  const parsed = payload as Partial<ProgressTransferPayload>;
  if (parsed.app !== "basic-english-coach" || parsed.version !== 1 || !parsed.progress) {
    throw new Error("这不是 Basic English Coach 的进度码。");
  }

  return parsed as ProgressTransferPayload;
}

export function updateAfterAttempt(
  progress: ProgressState,
  activity: Activity,
  focusWords: string[],
  correct: boolean
): ProgressState {
  const date = todayKey();
  const base = normalizeProgress(progress);
  const completedActivities =
    correct && !base.completedActivities.includes(activity.id)
      ? [...base.completedActivities, activity.id]
      : base.completedActivities;

  const wordMastery = { ...base.wordMastery };
  for (const word of focusWords) {
    const current = wordMastery[word] ?? { seen: 0, correct: 0, lastSeen: date };
    wordMastery[word] = {
      seen: current.seen + 1,
      correct: current.correct + (correct ? 1 : 0),
      lastSeen: date,
    };
  }

  const mistakes = { ...base.mistakes };
  if (!correct) {
    mistakes[activity.answer] = (mistakes[activity.answer] ?? 0) + 1;
  }

  return markUpdated(
    touchStudyDate(
      {
        ...base,
        completedActivities,
        wordMastery,
        mistakes,
      },
      date
    )
  );
}

export function advanceDay(progress: ProgressState): ProgressState {
  const base = normalizeProgress(progress);
  return markUpdated({
    ...base,
    currentDay: Math.min(base.currentDay + 1, COURSE_DAYS),
  });
}

function mergeWordMastery(
  local: Record<string, WordMastery>,
  remote: Record<string, WordMastery>
): Record<string, WordMastery> {
  const result: Record<string, WordMastery> = {};
  const words = uniqueStrings([...Object.keys(local), ...Object.keys(remote)]);

  for (const word of words) {
    const localEntry = local[word];
    const remoteEntry = remote[word];

    if (!localEntry) {
      result[word] = remoteEntry;
      continue;
    }

    if (!remoteEntry) {
      result[word] = localEntry;
      continue;
    }

    const seen = Math.max(localEntry.seen, remoteEntry.seen);
    result[word] = {
      seen,
      correct: Math.min(seen, Math.max(localEntry.correct, remoteEntry.correct)),
      lastSeen: latestDateKey([localEntry.lastSeen, remoteEntry.lastSeen]) ?? localEntry.lastSeen,
    };
  }

  return result;
}

function mergeMistakes(local: Record<string, number>, remote: Record<string, number>) {
  const result: Record<string, number> = {};
  const answers = uniqueStrings([...Object.keys(local), ...Object.keys(remote)]);

  for (const answer of answers) {
    result[answer] = Math.max(local[answer] ?? 0, remote[answer] ?? 0);
  }

  return result;
}

export function mergeProgress(
  localProgress: ProgressState,
  remoteProgress: ProgressState | null | undefined
): ProgressState {
  const local = normalizeProgress(localProgress);
  if (!remoteProgress) {
    return local;
  }

  const remote = normalizeProgress(remoteProgress);
  const studyDates = uniqueDateKeys([...local.studyDates, ...remote.studyDates]);
  const lastStudyDate = latestDateKey(studyDates);

  return markUpdated({
    currentDay: Math.max(local.currentDay, remote.currentDay),
    completedActivities: uniqueStrings([...local.completedActivities, ...remote.completedActivities]),
    wordMastery: mergeWordMastery(local.wordMastery, remote.wordMastery),
    mistakes: mergeMistakes(local.mistakes, remote.mistakes),
    studyDates,
    streak: calculateStreak(studyDates, lastStudyDate),
    lastStudyDate,
    updatedAt: null,
  });
}

export function createProgressTransferCode(progress: ProgressState) {
  const payload: ProgressTransferPayload = {
    app: "basic-english-coach",
    version: 1,
    exportedAt: nowIso(),
    progress: normalizeProgress(progress),
  };

  return `${TRANSFER_PREFIX}.${toBase64Url(JSON.stringify(payload))}`;
}

export function importProgressTransferCode(localProgress: ProgressState, code: string) {
  const payload = getPayloadFromTransferCode(code);
  return mergeProgress(localProgress, payload.progress);
}

export function resetProgress() {
  const progress = markUpdated(createInitialProgress());
  saveProgress(progress);
  return progress;
}
