import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  PenLine,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trophy,
  X,
  Volume2,
} from "lucide-react";
import { basicWords } from "./data/basicWords";
import { COURSE_LENGTH_DAYS, lessons } from "./data/lessons";
import { advanceDay, loadProgress, resetProgress, saveProgress, updateAfterAttempt } from "./lib/progress";
import { scoreActivity } from "./lib/scoring";
import { speakText } from "./lib/speech";
import type { Activity, AttemptResult, Lesson } from "./types";

const wordMap = new Map(basicWords.map((word) => [word.word, word]));

const activityLabels: Record<Activity["type"], string> = {
  listen: "听",
  vocabulary: "词",
  choose: "选",
  arrange: "排",
  spell: "拼",
  translate: "写",
  speak: "说",
  review: "复",
};

const categoryLabels = {
  operator: "功能词",
  thing: "名物词",
  quality: "性质词",
  action: "动作词",
  general: "抽象词",
};

function getActivityBadge(activity: Activity) {
  if (activity.id.includes("yesterday-review")) return "昨";
  if (activity.id.includes("today-output")) return "出";
  return activityLabels[activity.type];
}

function completionRatio(lesson: Lesson, completedActivities: string[]) {
  const done = lesson.activities.filter((activity) => completedActivities.includes(activity.id)).length;
  return done / lesson.activities.length;
}

function makeSelfCheckResult(): AttemptResult {
  return {
    score: 1,
    correct: true,
    missingWords: [],
    extraWords: [],
    nonBasicWords: [],
    isBasicCompliant: true,
    feedback: "已完成。先保证发音清楚，再慢慢加快。",
    nextStep: "进入下一个小任务。",
  };
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function ActivityStepper({
  lesson,
  activeIndex,
  completedActivities,
  onSelect,
}: {
  lesson: Lesson;
  activeIndex: number;
  completedActivities: string[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="activity-stepper" aria-label="今日任务">
      {lesson.activities.map((activity, index) => {
        const complete = completedActivities.includes(activity.id);
        const active = index === activeIndex;
        return (
          <button
            type="button"
            key={activity.id}
            className={`step ${active ? "active" : ""} ${complete ? "complete" : ""}`}
            onClick={() => onSelect(index)}
            aria-label={`${activityLabels[activity.type]} ${complete ? "已完成" : "未完成"}`}
            title={activity.prompt}
          >
            {complete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            <span>{getActivityBadge(activity)}</span>
          </button>
        );
      })}
    </div>
  );
}

function ActivityPanel({
  activity,
  completed,
  onAttempt,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  activity: Activity;
  completed: boolean;
  onAttempt: (activity: Activity, result: AttemptResult) => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [viewedWords, setViewedWords] = useState<string[]>([]);
  const [activeVocabIndex, setActiveVocabIndex] = useState<number | null>(null);
  const autoCompletedActivityRef = useRef<string | null>(null);

  useEffect(() => {
    setInput("");
    setResult(null);
    setSelectedIndexes([]);
    setViewedWords([]);
    setActiveVocabIndex(null);
    autoCompletedActivityRef.current = null;
  }, [activity.id]);

  const selectedWords = selectedIndexes.map((index) => activity.words?.[index] ?? "");
  const availableWords = activity.words ?? [];
  const vocabItems = activity.vocabItems ?? [];
  const viewedSet = new Set(viewedWords);
  const allVocabularyViewed = vocabItems.length > 0 && vocabItems.every((item) => viewedSet.has(item.word));
  const activeVocabItem = activeVocabIndex === null ? null : vocabItems[activeVocabIndex];

  function submit(value = input) {
    const attempt = scoreActivity(activity, value);
    setResult(attempt);
    onAttempt(activity, attempt);
  }

  function completeSelfCheck() {
    const attempt = makeSelfCheckResult();
    setResult(attempt);
    onAttempt(activity, attempt);
  }

  useEffect(() => {
    if (activity.type !== "vocabulary" || completed || !allVocabularyViewed) {
      return;
    }
    if (autoCompletedActivityRef.current === activity.id) {
      return;
    }

    autoCompletedActivityRef.current = activity.id;
    const attempt = makeSelfCheckResult();
    setResult(attempt);
    onAttempt(activity, attempt);
  }, [activity, allVocabularyViewed, completed, onAttempt]);

  function viewVocabularyWord(word: string) {
    speakText(word);
    setViewedWords((current) => (current.includes(word) ? current : [...current, word]));
  }

  function openVocabularyCard(index: number) {
    const item = vocabItems[index];
    if (!item) return;
    setActiveVocabIndex(index);
    viewVocabularyWord(item.word);
  }

  function showVocabularyOffset(offset: number) {
    if (activeVocabIndex === null || vocabItems.length === 0) return;
    const nextIndex = (activeVocabIndex + offset + vocabItems.length) % vocabItems.length;
    openVocabularyCard(nextIndex);
  }

  return (
    <section className="practice-panel" aria-labelledby="activity-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{activityLabels[activity.type]} · {activity.type}</span>
          <h2 id="activity-title">{activity.prompt}</h2>
        </div>
        {completed && (
          <span className="status-pill">
            <CheckCircle2 size={16} /> 已完成
          </span>
        )}
      </div>

      <div className="answer-zone">
        {(activity.type === "listen" || activity.type === "speak") && (
          <div className="audio-row">
            <button type="button" className="primary-button" onClick={() => speakText(activity.answer)}>
              <Volume2 size={18} /> 播放
            </button>
            {activity.type === "listen" && (
              <button type="button" className="secondary-button" onClick={completeSelfCheck}>
                <CheckCircle2 size={18} /> 已听到
              </button>
            )}
            {activity.type === "speak" && (
              <button type="button" className="secondary-button" onClick={completeSelfCheck}>
                <CheckCircle2 size={18} /> 已跟读
              </button>
            )}
          </div>
        )}

        {activity.type === "vocabulary" && (
          <div className="vocab-study">
            <div className="vocab-meter">
              <span>{viewedWords.length}/{vocabItems.length} 已点读</span>
              <strong>{allVocabularyViewed ? "可以完成" : "逐个点卡片"}</strong>
            </div>
            <div className="vocab-card-grid">
              {vocabItems.map((item, index) => {
                const viewed = viewedSet.has(item.word);
                const shortMeaning = item.zh.split("；")[0];
                return (
                  <button
                    type="button"
                    className={`vocab-card ${viewed ? "viewed" : ""}`}
                    key={item.word}
                    onClick={() => openVocabularyCard(index)}
                  >
                    <span>{categoryLabels[item.category]}</span>
                    <strong>{item.word}</strong>
                    <small className="vocab-meaning">{shortMeaning}</small>
                    <em>{viewed ? "已学习" : "点开学习"}</em>
                  </button>
                );
              })}
            </div>
            {activeVocabItem && activeVocabIndex !== null && (
              <div className="vocab-modal-backdrop" role="presentation" onClick={() => setActiveVocabIndex(null)}>
                <div
                  className="vocab-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${activeVocabItem.word} 词卡详情`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="vocab-modal-top">
                    <span>{activeVocabIndex + 1}/{vocabItems.length}</span>
                    <button type="button" className="icon-button" onClick={() => setActiveVocabIndex(null)} aria-label="关闭">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="vocab-modal-body">
                    <span className="category-pill">{categoryLabels[activeVocabItem.category]}</span>
                    <h3>{activeVocabItem.word}</h3>
                    <strong>{activeVocabItem.zh}</strong>
                    <button type="button" className="secondary-button" onClick={() => speakText(activeVocabItem.word)}>
                      <Volume2 size={18} /> 播放单词
                    </button>
                    <div className="example-box">
                      <div className="example-heading">
                        <span>例句</span>
                        <button type="button" className="mini-audio-button" onClick={() => speakText(activeVocabItem.example)}>
                          <Volume2 size={16} /> 播放例句
                        </button>
                      </div>
                      <p>{activeVocabItem.example}</p>
                      <small>{activeVocabItem.exampleZh}</small>
                    </div>
                    <div className="forms-box">
                      <span>常见词形</span>
                      <p>{activeVocabItem.forms.join(" / ")}</p>
                    </div>
                  </div>
                  <div className="vocab-modal-actions">
                    <button type="button" className="secondary-button" onClick={() => showVocabularyOffset(-1)}>
                      <ChevronLeft size={18} /> 上一个
                    </button>
                    <button type="button" className="primary-button" onClick={() => showVocabularyOffset(1)}>
                      下一个 <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activity.type === "choose" && (
          <div className="choice-grid">
            {activity.choices?.map((choice) => (
              <button
                type="button"
                className="choice-button"
                key={choice}
                onClick={() => {
                  setInput(choice);
                  submit(choice);
                }}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {activity.type === "arrange" && (
          <div className="arrange-zone">
            <div className="selected-words" aria-live="polite">
              {selectedWords.length > 0 ? selectedWords.join(" ") : " "}
            </div>
            <div className="word-bank">
              {availableWords.map((word, index) => {
                const used = selectedIndexes.includes(index);
                return (
                  <button
                    type="button"
                    key={`${word}-${index}`}
                    className="word-chip"
                    disabled={used}
                    onClick={() => setSelectedIndexes((current) => [...current, index])}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedIndexes((current) => current.slice(0, -1))}
                disabled={selectedIndexes.length === 0}
              >
                <RotateCcw size={18} /> 撤回
              </button>
              <button type="button" className="primary-button" onClick={() => submit(selectedWords.join(" "))}>
                <CheckCircle2 size={18} /> 检查
              </button>
            </div>
          </div>
        )}

        {(activity.type === "spell" || activity.type === "translate" || activity.type === "review") && (
          <div className="write-zone">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={activity.type === "spell" ? 2 : 4}
              spellCheck={false}
              placeholder={activity.type === "spell" ? "输入英文词" : "输入英文句子"}
            />
            <button type="button" className="primary-button" onClick={() => submit()} disabled={!input.trim()}>
              <PenLine size={18} /> 检查
            </button>
          </div>
        )}

      </div>

      {activity.hints.length > 0 && (
        <div className="hint-row">
          {activity.hints.map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      )}

      {result && (
        <div className={`result-box ${result.correct ? "correct" : "retry"}`} role="status">
          <strong>{result.correct ? "通过" : "再试一次"}</strong>
          <p>{result.feedback}</p>
          <small>{result.nextStep}</small>
        </div>
      )}

      <div className="panel-footer">
        <div className="answer-preview">
          <span>标准表达</span>
          <strong>{activity.answer}</strong>
        </div>
        <button
          type="button"
          className="next-button"
          onClick={onNext}
          disabled={nextDisabled || (activity.type === "vocabulary" && !completed && !allVocabularyViewed)}
        >
          <ChevronRight size={18} /> {nextLabel}
        </button>
      </div>
    </section>
  );
}

function WordFocus({ lesson }: { lesson: Lesson }) {
  return (
    <section className="focus-section">
      <div className="section-heading">
        <BookOpen size={18} />
        <h2>今日核心词</h2>
      </div>
      <div className="focus-grid">
        {lesson.focusWords.map((word) => {
          const entry = wordMap.get(word);
          return (
            <div className="word-card" key={word}>
              <strong>{word === "i" ? "I" : word}</strong>
              <span>{entry?.zh ?? "核心词"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const lesson = lessons[progress.currentDay - 1] ?? lessons[0];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const firstIncomplete = lesson.activities.findIndex((activity) => !progress.completedActivities.includes(activity.id));
    setActiveIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
  }, [lesson.id]);

  const activeActivity = lesson.activities[activeIndex] ?? lesson.activities[0];
  const completedForLesson = completionRatio(lesson, progress.completedActivities);
  const lessonDone = completedForLesson === 1;
  const masteredWords = Object.values(progress.wordMastery).filter((word) => word.seen > 0 && word.correct / word.seen >= 0.75).length;
  const totalSeen = Object.keys(progress.wordMastery).length;
  const coursePercent = Math.round(((progress.currentDay - 1 + completedForLesson) / COURSE_LENGTH_DAYS) * 100);
  const lastMistakes = Object.entries(progress.mistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  function handleAttempt(activity: Activity, result: AttemptResult) {
    setProgress((current) => updateAfterAttempt(current, activity, activity.targetWords ?? lesson.focusWords, result.correct));
  }

  function nextActivity() {
    if (activeIndex === lesson.activities.length - 1 && lessonDone) {
      startNextDay();
      return;
    }

    setActiveIndex((current) => Math.min(current + 1, lesson.activities.length - 1));
  }

  function startNextDay() {
    setProgress((current) => advanceDay(current));
  }

  return (
    <main className="app-shell">
      <section className="top-band">
        <div className="brand-mark">
          <ShieldCheck size={28} />
        </div>
        <div>
          <p>Basic English Coach</p>
          <h1>第 {lesson.day} 天 · {lesson.theme}</h1>
        </div>
        <button type="button" className="ghost-button" onClick={() => setProgress(resetProgress())}>
          <RefreshCw size={18} /> 重置
        </button>
      </section>

      <section className="dashboard-band">
        <StatTile icon={<CalendarDays size={22} />} label="课程进度" value={`${coursePercent}%`} detail={`${progress.currentDay}/${COURSE_LENGTH_DAYS} 天`} />
        <StatTile icon={<Trophy size={22} />} label="连续学习" value={`${progress.streak} 天`} detail={progress.lastStudyDate ?? "尚未开始"} />
        <StatTile icon={<BookOpen size={22} />} label="掌握词汇" value={`${masteredWords}`} detail={`已接触 ${totalSeen} 个`} />
      </section>

      <section className="main-grid">
        <aside className="side-panel">
          <div className="today-card">
            <div className="section-heading">
              <Play size={18} />
              <h2>今日任务</h2>
            </div>
            <div className="progress-track" aria-label="今日完成度">
              <span style={{ width: `${completedForLesson * 100}%` }} />
            </div>
            <ActivityStepper
              lesson={lesson}
              activeIndex={activeIndex}
              completedActivities={progress.completedActivities}
              onSelect={setActiveIndex}
            />
            {lessonDone && (
              <button type="button" className="primary-button wide" onClick={startNextDay}>
                <ChevronRight size={18} /> 进入明天
              </button>
            )}
          </div>

          <WordFocus lesson={lesson} />

          <section className="review-section">
            <div className="section-heading">
              <RotateCcw size={18} />
              <h2>复习入口</h2>
            </div>
            {lastMistakes.length === 0 ? (
              <p className="quiet-copy">完成翻译或复习题后，易错句会出现在这里。</p>
            ) : (
              <div className="mistake-list">
                {lastMistakes.map(([answer, count]) => (
                  <button
                    type="button"
                    className="mistake-item"
                    key={answer}
                    onClick={() => speakText(answer)}
                  >
                    <Volume2 size={16} />
                    <span>{answer}</span>
                    <strong>{count}</strong>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <ActivityPanel
          activity={activeActivity}
          completed={progress.completedActivities.includes(activeActivity.id)}
          onAttempt={handleAttempt}
          onNext={nextActivity}
          nextLabel={
            activeIndex === lesson.activities.length - 1
              ? lessonDone
                ? "进入明天"
                : "完成后进入明天"
              : "下一步"
          }
          nextDisabled={activeIndex === lesson.activities.length - 1 && !lessonDone}
        />
      </section>
    </main>
  );
}
