import { describe, expect, it } from "vitest";
import { basicWords } from "./basicWords";
import { COURSE_LENGTH_DAYS, lessons } from "./lessons";
import { checkBasicCompliance } from "../lib/scoring";

describe("course content", () => {
  it("ships the full 12-week lesson path", () => {
    expect(COURSE_LENGTH_DAYS).toBe(84);
    expect(lessons).toHaveLength(84);
    expect(lessons.every((lesson) => lesson.activities.length === 9)).toBe(true);
  });

  it("keeps a complete Basic English vocabulary baseline", () => {
    expect(basicWords.length).toBeGreaterThanOrEqual(850);
    expect(new Set(basicWords.map((word) => word.word)).size).toBe(basicWords.length);
  });

  it("keeps every English answer inside the Basic English validator", () => {
    const answers = lessons.flatMap((lesson) => lesson.activities.map((activity) => activity.answer));
    const failures = answers
      .map((answer) => ({ answer, report: checkBasicCompliance(answer) }))
      .filter(({ report }) => report.nonBasicWords.length > 0);

    expect(failures).toEqual([]);
  });

  it("uses yesterday at the start and today's sentence at the final output", () => {
    for (const [index, lesson] of lessons.entries()) {
      const translate = lesson.activities.find((activity) => activity.type === "translate");
      const first = lesson.activities[0];
      const final = lesson.activities[lesson.activities.length - 1];

      expect(first.id).toContain("yesterday-review");
      expect(final.id).toContain("today-output");
      expect(final.answer).toBe(translate?.answer);

      if (index > 0) {
        const previousTranslate = lessons[index - 1].activities.find((activity) => activity.type === "translate");
        expect(first.answer).toBe(previousTranslate?.answer);
      } else {
        expect(first.answer).toBe(translate?.answer);
      }
    }
  });

  it("schedules every Basic English word in the 84-day focus plan", () => {
    const plannedWords = new Set(lessons.flatMap((lesson) => lesson.focusWords));
    const missingWords = basicWords.map((word) => word.word).filter((word) => !plannedWords.has(word));

    expect(missingWords).toEqual([]);
  });

  it("turns the daily focus words into a vocabulary study activity", () => {
    for (const lesson of lessons) {
      const vocabulary = lesson.activities.find((activity) => activity.type === "vocabulary");

      expect(vocabulary?.targetWords).toEqual(lesson.focusWords);
      expect(vocabulary?.vocabItems?.map((item) => item.word.toLowerCase())).toEqual(
        lesson.focusWords.map((word) => (word === "i" ? "I" : word).toLowerCase())
      );
      expect(vocabulary?.vocabItems?.every((item) => item.zh && item.example && item.exampleZh)).toBe(true);
    }
  });

  it("shows concrete Chinese meanings for the first vocabulary cards", () => {
    const firstVocabulary = lessons[0].activities.find((activity) => activity.type === "vocabulary");
    const able = firstVocabulary?.vocabItems?.find((item) => item.word === "able");
    const account = firstVocabulary?.vocabItems?.find((item) => item.word === "account");

    expect(able?.zh).toContain("能够");
    expect(account?.zh).toContain("账户");
    expect(able?.example).toBe("I am able to go.");
    expect(account?.example).toBe("I have an account.");
    expect(account?.exampleZh).toBeTruthy();
  });

  it("avoids the most obvious unnatural vocabulary examples", () => {
    const examples = lessons.flatMap(
      (lesson) =>
        lesson.activities.find((activity) => activity.type === "vocabulary")?.vocabItems?.map((item) => item.example) ?? []
    );
    const joined = examples.join("\n");

    expect(joined).not.toContain("This is able.");
    expect(joined).not.toContain("This is a account.");
    expect(joined).not.toContain("This is a advertisement.");
    expect(joined).not.toContain("This is a acid.");
    expect(joined).not.toMatch(/\bI will (addition|adjustment|advertisement|account)\b/);
  });
});
