import { describe, expect, it } from "vitest";
import type { ProgressState } from "../types";
import {
  createInitialProgress,
  createProgressTransferCode,
  importProgressTransferCode,
  mergeProgress,
  normalizeProgress,
  updateAfterAttempt,
} from "./progress";

function progress(overrides: Partial<ProgressState>): ProgressState {
  return {
    ...createInitialProgress(),
    ...overrides,
  };
}

describe("progress normalization", () => {
  it("migrates older progress without studyDates", () => {
    const normalized = normalizeProgress({
      currentDay: 2,
      completedActivities: ["day-1-listen"],
      wordMastery: {},
      mistakes: {},
      streak: 3,
      lastStudyDate: "2026-05-24",
    });

    expect(normalized.currentDay).toBe(2);
    expect(normalized.streak).toBe(3);
    expect(normalized.studyDates).toEqual(["2026-05-22", "2026-05-23", "2026-05-24"]);
  });
});

describe("progress merging", () => {
  it("keeps the furthest day and unions completed activities", () => {
    const merged = mergeProgress(
      progress({
        currentDay: 2,
        completedActivities: ["day-1-listen"],
      }),
      progress({
        currentDay: 3,
        completedActivities: ["day-2-vocabulary"],
      })
    );

    expect(merged.currentDay).toBe(3);
    expect(merged.completedActivities).toEqual(["day-1-listen", "day-2-vocabulary"]);
  });

  it("keeps stronger word mastery from either device", () => {
    const merged = mergeProgress(
      progress({
        wordMastery: {
          book: { seen: 2, correct: 2, lastSeen: "2026-05-24" },
        },
      }),
      progress({
        wordMastery: {
          book: { seen: 5, correct: 3, lastSeen: "2026-05-25" },
        },
      })
    );

    expect(merged.wordMastery.book).toEqual({
      seen: 5,
      correct: 3,
      lastSeen: "2026-05-25",
    });
  });

  it("recalculates streak from merged study dates", () => {
    const merged = mergeProgress(
      progress({
        studyDates: ["2026-05-23", "2026-05-24"],
        lastStudyDate: "2026-05-24",
      }),
      progress({
        studyDates: ["2026-05-25"],
        lastStudyDate: "2026-05-25",
      })
    );

    expect(merged.lastStudyDate).toBe("2026-05-25");
    expect(merged.streak).toBe(3);
  });
});

describe("progress attempts", () => {
  it("adds the activity date when the learner practices", () => {
    const result = updateAfterAttempt(
      createInitialProgress(),
      {
        id: "day-1-listen",
        type: "listen",
        prompt: "Listen.",
        answer: "This is a book.",
        hints: [],
        scoringRule: "self-check",
      },
      ["book"],
      true
    );

    expect(result.completedActivities).toEqual(["day-1-listen"]);
    expect(result.studyDates).toHaveLength(1);
    expect(result.streak).toBe(1);
    expect(result.updatedAt).toBeTruthy();
  });
});

describe("progress transfer codes", () => {
  it("exports and imports progress as a mergeable code", () => {
    const local = progress({
      currentDay: 1,
      completedActivities: ["day-1-listen"],
    });
    const source = progress({
      currentDay: 4,
      completedActivities: ["day-2-vocabulary"],
      wordMastery: {
        book: { seen: 3, correct: 2, lastSeen: "2026-05-24" },
      },
    });

    const code = createProgressTransferCode(source);
    const imported = importProgressTransferCode(local, code);

    expect(code.startsWith("BEC1.")).toBe(true);
    expect(imported.currentDay).toBe(4);
    expect(imported.completedActivities).toEqual(["day-1-listen", "day-2-vocabulary"]);
    expect(imported.wordMastery.book.seen).toBe(3);
  });

  it("rejects invalid transfer codes", () => {
    expect(() => importProgressTransferCode(createInitialProgress(), "not-a-code")).toThrow("进度码无法识别");
  });
});
