import type { Activity, Lesson } from "../types";
import { basicWords } from "./basicWords";
import { getLearningCopy } from "./wordLearning";

interface LessonSeed {
  phrase: string;
  zh: string;
  theme: string;
  focusWords: string[];
  patterns: string[];
}

const seeds: LessonSeed[] = [
  { phrase: "This is a book.", zh: "这是一本书。", theme: "建立最小表达", focusWords: ["this", "be", "book"], patterns: ["This is ..."] },
  { phrase: "That is a table.", zh: "那是一张桌子。", theme: "建立最小表达", focusWords: ["that", "be", "table"], patterns: ["That is ..."] },
  { phrase: "I am here.", zh: "我在这里。", theme: "建立最小表达", focusWords: ["i", "be", "here"], patterns: ["I am ..."] },
  { phrase: "You are good.", zh: "你很好。", theme: "建立最小表达", focusWords: ["you", "be", "good"], patterns: ["You are ..."] },
  { phrase: "The room is warm.", zh: "房间是暖的。", theme: "建立最小表达", focusWords: ["the", "room", "warm"], patterns: ["The ... is ..."] },
  { phrase: "The water is cold.", zh: "水是冷的。", theme: "建立最小表达", focusWords: ["water", "cold"], patterns: ["The ... is ..."] },
  { phrase: "This is good.", zh: "这很好。", theme: "建立最小表达", focusWords: ["this", "be", "good"], patterns: ["This is ..."] },
  { phrase: "I have a book.", zh: "我有一本书。", theme: "需要与动作", focusWords: ["i", "have", "book"], patterns: ["I have ..."] },
  { phrase: "I need water.", zh: "我需要水。", theme: "需要与动作", focusWords: ["i", "need", "water"], patterns: ["I need ..."] },
  { phrase: "I see the house.", zh: "我看见那所房子。", theme: "需要与动作", focusWords: ["i", "see", "house"], patterns: ["I see ..."] },
  { phrase: "I go to the market.", zh: "我去市场。", theme: "需要与动作", focusWords: ["i", "go", "market"], patterns: ["I go to ..."] },
  { phrase: "Please give the book to the boy.", zh: "请把书给那个男孩。", theme: "需要与动作", focusWords: ["please", "give", "book", "boy"], patterns: ["Please give ... to ..."] },
  { phrase: "I will take the train.", zh: "我会乘火车。", theme: "需要与动作", focusWords: ["i", "will", "take", "train"], patterns: ["I will ..."] },
  { phrase: "I do the work.", zh: "我做这项工作。", theme: "需要与动作", focusWords: ["i", "do", "work"], patterns: ["I do ..."] },
  { phrase: "The man is in the room.", zh: "那个男人在房间里。", theme: "人和地点", focusWords: ["man", "in", "room"], patterns: ["The ... is in ..."] },
  { phrase: "The woman is at the door.", zh: "那个女人在门口。", theme: "人和地点", focusWords: ["woman", "at", "door"], patterns: ["The ... is at ..."] },
  { phrase: "The boy is near the house.", zh: "那个男孩在房子附近。", theme: "人和地点", focusWords: ["boy", "near", "house"], patterns: ["The ... is near ..."] },
  { phrase: "The girl is under the tree.", zh: "那个女孩在树下。", theme: "人和地点", focusWords: ["girl", "under", "tree"], patterns: ["The ... is under ..."] },
  { phrase: "He is with a friend.", zh: "他和一个朋友在一起。", theme: "人和地点", focusWords: ["he", "with", "friend"], patterns: ["He is with ..."] },
  { phrase: "Who is there.", zh: "谁在那里。", theme: "人和地点", focusWords: ["who", "be", "there"], patterns: ["Who is ..."] },
  { phrase: "You are here with a friend.", zh: "你和一个朋友在这里。", theme: "人和地点", focusWords: ["you", "here", "friend"], patterns: ["You are here with ..."] },
  { phrase: "The sky is blue.", zh: "天空是蓝色的。", theme: "描述事物", focusWords: ["sky", "blue"], patterns: ["The ... is ..."] },
  { phrase: "The flower is red.", zh: "花是红色的。", theme: "描述事物", focusWords: ["flower", "red"], patterns: ["The ... is ..."] },
  { phrase: "The road is long.", zh: "路很长。", theme: "描述事物", focusWords: ["road", "long"], patterns: ["The ... is ..."] },
  { phrase: "The bag is small.", zh: "包很小。", theme: "描述事物", focusWords: ["bag", "small"], patterns: ["The ... is ..."] },
  { phrase: "The stone is hard.", zh: "石头很硬。", theme: "描述事物", focusWords: ["stone", "hard"], patterns: ["The ... is ..."] },
  { phrase: "The cloth is soft.", zh: "布很软。", theme: "描述事物", focusWords: ["cloth", "soft"], patterns: ["The ... is ..."] },
  { phrase: "The room is clean.", zh: "房间很干净。", theme: "描述事物", focusWords: ["room", "clean"], patterns: ["The ... is ..."] },
  { phrase: "I will go tomorrow.", zh: "我明天会去。", theme: "时间表达", focusWords: ["i", "will", "go", "tomorrow"], patterns: ["I will ..."] },
  { phrase: "I had food in the morning.", zh: "我早上吃过东西。", theme: "时间表达", focusWords: ["i", "have", "food", "morning"], patterns: ["I had ... in the morning"] },
  { phrase: "The night is quiet.", zh: "夜晚很安静。", theme: "时间表达", focusWords: ["night", "quiet"], patterns: ["The ... is ..."] },
  { phrase: "This week is good.", zh: "这个星期不错。", theme: "时间表达", focusWords: ["this", "week", "good"], patterns: ["This ... is ..."] },
  { phrase: "This year is long.", zh: "这一年很长。", theme: "时间表达", focusWords: ["this", "year", "long"], patterns: ["This ... is ..."] },
  { phrase: "Yesterday was cold.", zh: "昨天很冷。", theme: "时间表达", focusWords: ["yesterday", "be", "cold"], patterns: ["... was ..."] },
  { phrase: "Tomorrow will be warm.", zh: "明天会暖和。", theme: "时间表达", focusWords: ["tomorrow", "will", "be", "warm"], patterns: ["... will be ..."] },
  { phrase: "The bread is on the plate.", zh: "面包在盘子上。", theme: "食物和物品", focusWords: ["bread", "on", "plate"], patterns: ["The ... is on ..."] },
  { phrase: "The milk is in the cup.", zh: "牛奶在杯子里。", theme: "食物和物品", focusWords: ["milk", "in", "cup"], patterns: ["The ... is in ..."] },
  { phrase: "The apple is red.", zh: "苹果是红色的。", theme: "食物和物品", focusWords: ["apple", "red"], patterns: ["The ... is ..."] },
  { phrase: "The egg is good.", zh: "鸡蛋是好的。", theme: "食物和物品", focusWords: ["egg", "good"], patterns: ["The ... is ..."] },
  { phrase: "The fish is on the table.", zh: "鱼在桌子上。", theme: "食物和物品", focusWords: ["fish", "on", "table"], patterns: ["The ... is on ..."] },
  { phrase: "The soup is warm.", zh: "汤是热的。", theme: "食物和物品", focusWords: ["soup", "warm"], patterns: ["The ... is ..."] },
  { phrase: "I need food.", zh: "我需要食物。", theme: "食物和物品", focusWords: ["i", "need", "food"], patterns: ["I need ..."] },
  { phrase: "I am happy.", zh: "我很高兴。", theme: "感觉和身体", focusWords: ["i", "be", "happy"], patterns: ["I am ..."] },
  { phrase: "The man is ill.", zh: "那个男人不舒服。", theme: "感觉和身体", focusWords: ["man", "ill"], patterns: ["The ... is ..."] },
  { phrase: "The hand is cold.", zh: "手是冷的。", theme: "感觉和身体", focusWords: ["hand", "cold"], patterns: ["The ... is ..."] },
  { phrase: "The eye is open.", zh: "眼睛是睁开的。", theme: "感觉和身体", focusWords: ["eye", "open"], patterns: ["The ... is ..."] },
  { phrase: "The heart is strong.", zh: "心脏很强。", theme: "感觉和身体", focusWords: ["heart", "strong"], patterns: ["The ... is ..."] },
  { phrase: "I have pain.", zh: "我有疼痛。", theme: "感觉和身体", focusWords: ["i", "have", "pain"], patterns: ["I have ..."] },
  { phrase: "I have fear.", zh: "我感到害怕。", theme: "感觉和身体", focusWords: ["i", "have", "fear"], patterns: ["I have ..."] },
  { phrase: "The wind is strong.", zh: "风很强。", theme: "方向和天气", focusWords: ["wind", "strong"], patterns: ["The ... is ..."] },
  { phrase: "The rain is cold.", zh: "雨很冷。", theme: "方向和天气", focusWords: ["rain", "cold"], patterns: ["The ... is ..."] },
  { phrase: "The sun is high.", zh: "太阳很高。", theme: "方向和天气", focusWords: ["sun", "high"], patterns: ["The ... is ..."] },
  { phrase: "I will go north.", zh: "我会向北去。", theme: "方向和天气", focusWords: ["i", "will", "go", "north"], patterns: ["I will go ..."] },
  { phrase: "The market is east.", zh: "市场在东边。", theme: "方向和天气", focusWords: ["market", "east"], patterns: ["The ... is ..."] },
  { phrase: "The road is under water.", zh: "路在水下。", theme: "方向和天气", focusWords: ["road", "under", "water"], patterns: ["The ... is under ..."] },
  { phrase: "The weather is good.", zh: "天气很好。", theme: "方向和天气", focusWords: ["weather", "good"], patterns: ["The ... is ..."] },
  { phrase: "I do business.", zh: "我做业务。", theme: "工作和社会", focusWords: ["i", "do", "business"], patterns: ["I do ..."] },
  { phrase: "The manager is in the office.", zh: "经理在办公室里。", theme: "工作和社会", focusWords: ["manager", "in", "office"], patterns: ["The ... is in ..."] },
  { phrase: "The school is open.", zh: "学校是开放的。", theme: "工作和社会", focusWords: ["school", "open"], patterns: ["The ... is ..."] },
  { phrase: "The letter is on the table.", zh: "信在桌子上。", theme: "工作和社会", focusWords: ["letter", "on", "table"], patterns: ["The ... is on ..."] },
  { phrase: "The price is low.", zh: "价格很低。", theme: "工作和社会", focusWords: ["price", "low"], patterns: ["The ... is ..."] },
  { phrase: "The meeting is here.", zh: "会议在这里。", theme: "工作和社会", focusWords: ["meeting", "here"], patterns: ["The ... is ..."] },
  { phrase: "I have a question.", zh: "我有一个问题。", theme: "工作和社会", focusWords: ["i", "have", "question"], patterns: ["I have ..."] },
  { phrase: "There is danger.", zh: "有危险。", theme: "问题和处理", focusWords: ["there", "be", "danger"], patterns: ["There is ..."] },
  { phrase: "I need help.", zh: "我需要帮助。", theme: "问题和处理", focusWords: ["i", "need", "help"], patterns: ["I need ..."] },
  { phrase: "The machine is broken.", zh: "机器坏了。", theme: "问题和处理", focusWords: ["machine", "broken"], patterns: ["The ... is ..."] },
  { phrase: "This is an error.", zh: "这是一个错误。", theme: "问题和处理", focusWords: ["this", "be", "error"], patterns: ["This is ..."] },
  { phrase: "The door is shut.", zh: "门是关着的。", theme: "问题和处理", focusWords: ["door", "shut"], patterns: ["The ... is ..."] },
  { phrase: "Please make a decision.", zh: "请做一个决定。", theme: "问题和处理", focusWords: ["please", "make", "decision"], patterns: ["Please make ..."] },
  { phrase: "I will make a change.", zh: "我会做出改变。", theme: "问题和处理", focusWords: ["i", "will", "make", "change"], patterns: ["I will make ..."] },
  { phrase: "I have no money.", zh: "我没有钱。", theme: "更完整表达", focusWords: ["i", "have", "no", "money"], patterns: ["I have no ..."] },
  { phrase: "The train is late.", zh: "火车晚了。", theme: "更完整表达", focusWords: ["train", "late"], patterns: ["The ... is ..."] },
  { phrase: "The work is important.", zh: "这项工作很重要。", theme: "更完整表达", focusWords: ["work", "important"], patterns: ["The ... is ..."] },
  { phrase: "This is possible.", zh: "这是可能的。", theme: "更完整表达", focusWords: ["this", "be", "possible"], patterns: ["This is ..."] },
  { phrase: "I have a good idea.", zh: "我有一个好想法。", theme: "更完整表达", focusWords: ["i", "have", "good", "idea"], patterns: ["I have ..."] },
  { phrase: "The picture is beautiful.", zh: "这张图片很美。", theme: "更完整表达", focusWords: ["picture", "beautiful"], patterns: ["The ... is ..."] },
  { phrase: "I will send a letter.", zh: "我会寄一封信。", theme: "更完整表达", focusWords: ["i", "will", "send", "letter"], patterns: ["I will ..."] },
  { phrase: "I am here for work.", zh: "我来这里工作。", theme: "综合输出", focusWords: ["i", "here", "for", "work"], patterns: ["I am here for ..."] },
  { phrase: "I have a room in the house.", zh: "我在房子里有一个房间。", theme: "综合输出", focusWords: ["i", "have", "room", "house"], patterns: ["I have ... in ..."] },
  { phrase: "I need water and food.", zh: "我需要水和食物。", theme: "综合输出", focusWords: ["i", "need", "water", "food"], patterns: ["I need ... and ..."] },
  { phrase: "I will go to the station.", zh: "我会去车站。", theme: "综合输出", focusWords: ["i", "will", "go", "station"], patterns: ["I will go to ..."] },
  { phrase: "Please give the answer.", zh: "请给出回答。", theme: "综合输出", focusWords: ["please", "give", "answer"], patterns: ["Please give ..."] },
  { phrase: "This is a good question.", zh: "这是一个好问题。", theme: "综合输出", focusWords: ["this", "good", "question"], patterns: ["This is ..."] },
  { phrase: "I will give a simple answer.", zh: "我会给一个简单回答。", theme: "综合输出", focusWords: ["i", "will", "give", "simple", "answer"], patterns: ["I will give ..."] },
];

const CHOICE_BANK = [
  "book",
  "water",
  "house",
  "market",
  "friend",
  "room",
  "road",
  "food",
  "work",
  "question",
  "answer",
  "good",
  "cold",
  "warm",
  "open",
  "simple",
];

function displayWord(word: string) {
  return word === "i" ? "I" : word;
}

function wordEntry(word: string) {
  return basicWords.find((entry) => entry.word === word);
}

function sentenceWords(sentence: string) {
  return sentence.replace(/[.?!]/g, "").split(/\s+/).filter(Boolean);
}

function rotateWords(words: string[], day: number) {
  if (words.length <= 2) return words.slice().reverse();
  const offset = day % words.length;
  return [...words.slice(offset), ...words.slice(0, offset)];
}

function pickChoiceWord(words: string[]) {
  return words.find((word) => word.length > 2 && word !== "the") ?? words[0];
}

function buildChoices(answer: string, day: number) {
  const distractors = CHOICE_BANK.filter((word) => word !== answer).slice(day % 5, day % 5 + 3);
  return rotateWords([answer, ...distractors], day).map(displayWord);
}

function getDailyCoreWords(seed: LessonSeed, index: number) {
  const allWords = basicWords.map((entry) => entry.word);
  const start = Math.floor((index * allWords.length) / seeds.length);
  const end = Math.floor(((index + 1) * allWords.length) / seeds.length);
  const scheduledWords = allWords.slice(start, end);
  return Array.from(new Set([...seed.focusWords, ...scheduledWords]));
}

function getVocabularyItems(focusWords: string[]) {
  return focusWords.map((word) => {
    const entry = wordEntry(word);
    const learning = entry
      ? getLearningCopy(entry)
      : {
          zh: "Basic English 核心词",
          example: `This word is ${displayWord(word)}.`,
          exampleZh: `这个词是 ${displayWord(word)}。`,
        };
    return {
      word: displayWord(word),
      zh: learning.zh,
      category: entry?.category ?? "general",
      forms: entry?.allowedForms.slice(0, 4).map(displayWord) ?? [displayWord(word)],
      example: learning.example,
      exampleZh: learning.exampleZh,
    };
  });
}

function buildDailyChoices(answer: string, focusWords: string[], day: number) {
  const pool = focusWords.filter((word) => word !== answer);
  const distractors = rotateWords(pool.length >= 3 ? pool : CHOICE_BANK.filter((word) => word !== answer), day).slice(0, 3);
  return rotateWords([answer, ...distractors], day).map(displayWord);
}

function buildActivities(seed: LessonSeed, day: number, focusWords: string[], yesterdayAnswer: string | null): Activity[] {
  const choiceAnswer = pickChoiceWord(focusWords);
  const spellAnswer = rotateWords(focusWords.filter((word) => word.length >= 4), day)[0] ?? choiceAnswer;
  const words = rotateWords(sentenceWords(seed.phrase), day);

  return [
    {
      id: `day-${day}-yesterday-review`,
      type: "review",
      prompt: yesterdayAnswer ? "昨日回顾：写出昨天的完整表达。" : "入门预热：写出今天这句最小表达。",
      answer: yesterdayAnswer ?? seed.phrase,
      hints: [],
      targetWords: yesterdayAnswer ? [] : seed.focusWords,
      scoringRule: "basic-compliance",
    },
    {
      id: `day-${day}-vocabulary`,
      type: "vocabulary",
      prompt: `今日词汇：逐个点读 ${focusWords.length} 个 Basic English 核心词。`,
      answer: focusWords.map(displayWord).join(" "),
      hints: ["点每张词卡听发音并看中文线索，全部看完才能完成。"],
      targetWords: focusWords,
      vocabItems: getVocabularyItems(focusWords),
      scoringRule: "self-check",
    },
    {
      id: `day-${day}-listen`,
      type: "listen",
      prompt: "今日学习：听新句子，先抓住主语和关键词。",
      answer: seed.phrase,
      hints: ["点击播放后，跟着默读一遍。"],
      targetWords: seed.focusWords,
      scoringRule: "self-check",
    },
    {
      id: `day-${day}-choose`,
      type: "choose",
      prompt: `今日词汇抽测：选择英文 “${wordEntry(choiceAnswer) ? getLearningCopy(wordEntry(choiceAnswer)!).zh : choiceAnswer}”。`,
      answer: displayWord(choiceAnswer),
      choices: buildDailyChoices(choiceAnswer, focusWords, day),
      hints: [`今天的主题是：${seed.theme}`, `今天要接触 ${focusWords.length} 个核心词。`],
      targetWords: [choiceAnswer],
      scoringRule: "exact",
    },
    {
      id: `day-${day}-arrange`,
      type: "arrange",
      prompt: "今日学习：把词块排成一句 Basic English。",
      answer: seed.phrase,
      words,
      hints: seed.patterns,
      targetWords: seed.focusWords,
      scoringRule: "word-order",
    },
    {
      id: `day-${day}-spell`,
      type: "spell",
      prompt: `今日学习：拼写这个核心词：${displayWord(spellAnswer)}`,
      answer: displayWord(spellAnswer),
      hints: [`中文线索：${wordEntry(spellAnswer) ? getLearningCopy(wordEntry(spellAnswer)!).zh : spellAnswer}`, "只输入一个英文词。"],
      targetWords: [spellAnswer],
      scoringRule: "exact",
    },
    {
      id: `day-${day}-translate`,
      type: "translate",
      prompt: `今日学习：把中文写成英文：${seed.zh}`,
      answer: seed.phrase,
      hints: seed.patterns,
      targetWords: seed.focusWords,
      scoringRule: "basic-compliance",
    },
    {
      id: `day-${day}-speak`,
      type: "speak",
      prompt: "今日学习：大声跟读今天的表达。",
      answer: seed.phrase,
      hints: ["先慢后快，每个词都说清楚。"],
      targetWords: seed.focusWords,
      scoringRule: "basic-compliance",
    },
    {
      id: `day-${day}-today-output`,
      type: "review",
      prompt: "今日输出：不看提示，写出今天的完整表达。",
      answer: seed.phrase,
      hints: ["这是今天的新句子。完成后就可以进入明天。"],
      targetWords: seed.focusWords,
      scoringRule: "basic-compliance",
    },
  ];
}

export const lessons: Lesson[] = seeds.map((seed, index) => {
  const day = index + 1;
  const yesterdayAnswer = index > 0 ? seeds[index - 1].phrase : null;
  const focusWords = getDailyCoreWords(seed, index);
  const reviewRefs = Array.from({ length: Math.min(3, index) }, (_, offset) => `lesson-${index - offset}`);

  return {
    id: `lesson-${day}`,
    day,
    week: Math.ceil(day / 7),
    title: `第 ${day} 天：${seed.theme}`,
    theme: seed.theme,
    focusWords,
    patterns: seed.patterns,
    activities: buildActivities(seed, day, focusWords, yesterdayAnswer),
    reviewRefs,
  };
});

export const COURSE_LENGTH_DAYS = lessons.length;
