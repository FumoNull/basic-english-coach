import { describe, expect, it } from "vitest";
import { checkBasicCompliance, scoreFreeAnswer } from "./scoring";

describe("Basic English scoring", () => {
  it("accepts Basic English forms with case and punctuation differences", () => {
    const result = scoreFreeAnswer("i need water", "I need water.", "basic-compliance");
    expect(result.correct).toBe(true);
    expect(result.isBasicCompliant).toBe(true);
  });

  it("flags words outside the Basic English core", () => {
    const report = checkBasicCompliance("I want coffee.");
    expect(report.nonBasicWords).toEqual(["want", "coffee"]);
  });

  it("detects correct words in the wrong order", () => {
    const result = scoreFreeAnswer("Water need I", "I need water.", "word-order");
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0.7);
    expect(result.missingWords).toEqual([]);
  });
});
