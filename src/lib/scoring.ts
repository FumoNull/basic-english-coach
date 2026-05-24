import { BASIC_WORD_SET, FORM_TO_BASE } from "../data/basicWords";
import type { Activity, AttemptResult } from "../types";

const WORD_RE = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;

export interface ComplianceReport {
  tokens: string[];
  baseTokens: string[];
  nonBasicWords: string[];
}

export function normalizeText(value: string) {
  return value
    .replace(/[’]/g, "'")
    .replace(/[.,!?;:()[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function tokenize(value: string) {
  return normalizeText(value).match(WORD_RE)?.map((token) => token.replace(/^'+|'+$/g, "")) ?? [];
}

export function toBaseToken(token: string) {
  const normalized = token.toLowerCase();
  return FORM_TO_BASE.get(normalized) ?? (BASIC_WORD_SET.has(normalized) ? normalized : null);
}

export function checkBasicCompliance(value: string): ComplianceReport {
  const tokens = tokenize(value);
  const baseTokens: string[] = [];
  const nonBasicWords: string[] = [];

  for (const token of tokens) {
    const base = toBaseToken(token);
    if (base) {
      baseTokens.push(base);
    } else {
      nonBasicWords.push(token);
    }
  }

  return {
    tokens,
    baseTokens,
    nonBasicWords: Array.from(new Set(nonBasicWords)),
  };
}

function countTokens(tokens: string[]) {
  return tokens.reduce<Record<string, number>>((counts, token) => {
    counts[token] = (counts[token] ?? 0) + 1;
    return counts;
  }, {});
}

function difference(expected: string[], actual: string[]) {
  const expectedCounts = countTokens(expected);
  const actualCounts = countTokens(actual);
  const missing: string[] = [];
  const extra: string[] = [];

  for (const [word, count] of Object.entries(expectedCounts)) {
    const gap = count - (actualCounts[word] ?? 0);
    for (let i = 0; i < gap; i += 1) missing.push(word);
  }

  for (const [word, count] of Object.entries(actualCounts)) {
    const over = count - (expectedCounts[word] ?? 0);
    for (let i = 0; i < over; i += 1) extra.push(word);
  }

  return { missing, extra };
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) =>
    Array.from({ length: b.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );

  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function suggestBasicWord(token: string) {
  let best = "";
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const word of BASIC_WORD_SET) {
    const distance = levenshtein(token, word);
    if (distance < bestDistance) {
      best = word;
      bestDistance = distance;
    }
  }

  return bestDistance <= 2 ? best : "";
}

function buildFeedback(result: Omit<AttemptResult, "feedback" | "nextStep">, expectedAnswer: string) {
  if (result.correct) {
    return {
      feedback: "对了。这个句子在 Basic English 范围内，可以继续下一步。",
      nextStep: "读一遍标准答案，再进入下一个小任务。",
    };
  }

  if (result.nonBasicWords.length > 0) {
    const suggestions = result.nonBasicWords
      .map((word) => {
        const suggestion = suggestBasicWord(word);
        return suggestion ? `${word} -> ${suggestion}` : word;
      })
      .join("，");

    return {
      feedback: `有词不在 850 核心词范围内：${result.nonBasicWords.join("，")}。${suggestions ? `可参考：${suggestions}。` : ""}`,
      nextStep: "先用更小的词表达同一个意思。",
    };
  }

  if (result.missingWords.length > 0 || result.extraWords.length > 0) {
    const missing = result.missingWords.length ? `少了：${result.missingWords.join("，")}。` : "";
    const extra = result.extraWords.length ? `多了或替换了：${result.extraWords.join("，")}。` : "";
    return {
      feedback: `${missing}${extra}标准答案：${expectedAnswer}`,
      nextStep: "看提示，把词放回正确位置再试一次。",
    };
  }

  return {
    feedback: `词基本对，但顺序或形式还需要调整。标准答案：${expectedAnswer}`,
    nextStep: "按英文顺序重排：主语 + 动作/状态 + 地点/对象。",
  };
}

export function scoreFreeAnswer(input: string, expectedAnswer: string, scoringRule: Activity["scoringRule"]): AttemptResult {
  const actual = checkBasicCompliance(input);
  const expected = checkBasicCompliance(expectedAnswer);
  const { missing, extra } = difference(expected.baseTokens, actual.baseTokens);
  const exactText = normalizeText(input) === normalizeText(expectedAnswer);
  const exactBases = expected.baseTokens.join(" ") === actual.baseTokens.join(" ");
  const bagMatches = missing.length === 0 && extra.length === 0;

  let score = 0;
  if (exactText || exactBases) {
    score = 1;
  } else if (bagMatches && scoringRule === "word-order") {
    score = 0.7;
  } else if (bagMatches) {
    score = 0.8;
  } else {
    const expectedCount = Math.max(expected.baseTokens.length, 1);
    score = Math.max(0, (expectedCount - missing.length - extra.length * 0.5) / expectedCount);
  }

  const correct = score >= (scoringRule === "basic-compliance" ? 0.75 : 0.95) && actual.nonBasicWords.length === 0;
  const resultWithoutCopy = {
    score: Number(score.toFixed(2)),
    correct,
    missingWords: missing,
    extraWords: extra,
    nonBasicWords: actual.nonBasicWords,
    isBasicCompliant: actual.nonBasicWords.length === 0,
  };
  const copy = buildFeedback(resultWithoutCopy, expectedAnswer);

  return {
    ...resultWithoutCopy,
    ...copy,
  };
}

export function scoreActivity(activity: Activity, input: string): AttemptResult {
  if (activity.scoringRule === "self-check") {
    return {
      score: 1,
      correct: true,
      missingWords: [],
      extraWords: [],
      nonBasicWords: [],
      isBasicCompliant: true,
      feedback: "已完成。跟读时优先把每个词说清楚，不急着说快。",
      nextStep: "进入下一个任务。",
    };
  }

  return scoreFreeAnswer(input, activity.answer, activity.scoringRule);
}
