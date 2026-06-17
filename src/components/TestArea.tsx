/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  HelpCircle, 
  GraduationCap, 
  RefreshCw, 
  Award,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Question, QuestionType, TestMode } from "../types";

interface TestAreaProps {
  questions: Question[];
  mode: TestMode;
  onFinishSession: (results: Record<string, { isCorrect: boolean; answers: string[] }>) => void;
  onExit: () => void;
}

export default function TestArea({ questions, mode, onFinishSession, onExit }: TestAreaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Track correctness of each question in this session
  const [sessionResults, setSessionResults] = useState<Record<string, { isCorrect: boolean; answers: string[] }>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Reset answer states when question changes
  useEffect(() => {
    setSelectedAnswers([]);
    setIsSubmitted(false);
  }, [currentIndex]);

  // Auto advance to the next question 1 second after an answer is submitted
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        handleNext();
      }, 1000); // 1000ms delay to let user see feedback clearly before auto advancing
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, currentIndex]);

  if (totalQuestions === 0) {
    return (
      <div className="bg-white border border-editorial-border p-12 text-center max-w-lg mx-auto rounded-none shadow-sm" id="test-empty">
        <AlertCircle className="w-12 h-12 text-[#D9534F] mx-auto mb-4" />
        <h3 className="font-serif italic text-2xl text-editorial-ink">題庫暫無符合項目</h3>
        <p className="text-xs text-editorial-muted mt-2">
          該模式篩選下尚無相關題目，請點擊下方按鈕回到控制台大廳，或者匯入客製化題目。
        </p>
        <button
          onClick={onExit}
          className="mt-6 border border-editorial-ink text-editorial-ink hover:bg-editorial-ink hover:text-white uppercase tracking-widest text-[10px] font-bold py-3 px-6 transition duration-200 cursor-pointer"
          id="btn-empty-exit"
        >
          返回大廳 Menu
        </button>
      </div>
    );
  }

  const getModeLabel = () => {
    switch (mode) {
      case TestMode.All: return "All Questions / 全部測驗";
      case TestMode.Sequential: return "Sequential Review / 循序記憶";
      case TestMode.Random: return "Randomized Challenge / 隨機抽測";
      case TestMode.IncorrectOnly: return "MISTAKE RE-TEST / 錯題重測";
      default: return "Self Study / 自主學習";
    }
  };

  // Toggle selection
  const handleOptionClick = (val: string) => {
    if (isSubmitted) return;

    if (currentQuestion.type === QuestionType.YesNo || currentQuestion.type === QuestionType.Single) {
      setSelectedAnswers([val]);
      handleSubmitAnswer([val]);
    } else {
      if (selectedAnswers.includes(val)) {
        setSelectedAnswers(selectedAnswers.filter(item => item !== val));
      } else {
        setSelectedAnswers([...selectedAnswers, val]);
      }
    }
  };

  const handlesMultiSubmit = () => {
    if (isSubmitted || selectedAnswers.length === 0) return;
    handleSubmitAnswer(selectedAnswers);
  };

  const handleSubmitAnswer = (answersSelected: string[]) => {
    const correctAnswers = currentQuestion.parsedAnswers;
    const isCorrect = 
      correctAnswers.length === answersSelected.length &&
      correctAnswers.every(ans => answersSelected.includes(ans));

    setSessionResults(prev => ({
      ...prev,
      [currentQuestion.id]: { isCorrect, answers: answersSelected }
    }));

    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinish = () => {
    onFinishSession(sessionResults);
  };

  const metrics = Object.values(sessionResults) as Array<{ isCorrect: boolean; answers: string[] }>;
  const correctCount = metrics.filter(r => r.isCorrect).length;
  const wrongCount = metrics.filter(r => !r.isCorrect).length;
  const finalPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const getOptionsList = () => {
    if (currentQuestion.options.length > 0) {
      return currentQuestion.options.map((opt, i) => ({
        label: `${i + 1}`,
        text: opt
      }));
    }
    return [
      { label: "1", text: "選項 (1)" },
      { label: "2", text: "選項 (2)" },
      { label: "3", text: "選項 (3)" },
      { label: "4", text: "選項 (4)" }
    ];
  };

  // ACTIVE QUIZ WORKSPACE
  if (!isFinished) {
    const optionsList = getOptionsList();
    const correctAnswers = currentQuestion.parsedAnswers;

    return (
      <div className="max-w-4xl mx-auto space-y-8" id="quiz-workspace">
        {/* Play Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-editorial-border p-6 shadow-2xs gap-4" id="quiz-header">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-editorial-ink transition"
            id="btn-exit-test"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quit and Exit / 結束
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-editorial-warm-taupe border border-editorial-border px-3 py-1">
              {getModeLabel()}
            </span>
            <div className="text-right flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-muted">Progress</span>
              <span className="font-serif text-lg leading-none text-editorial-ink">
                {String(currentIndex + 1).padStart(2, '0')}{" "}
                <span className="text-sm text-editorial-muted italic">of</span>{" "}
                {String(totalQuestions).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Big visual editorial progress tracker */}
        <div className="w-full bg-[#E5E5E1] h-1 shadow-sm" id="quiz-progress-bar">
          <div 
            className="h-full bg-editorial-ink transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* CENTRAL ANSWER SHEET CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-editorial-border p-8 sm:p-12 shadow-xs space-y-8 relative"
            id={`quiz-card-${currentQuestion.id}`}
          >
            {/* Meta row */}
            <div className="flex flex-wrap gap-2 items-center justify-between border-b border-editorial-stone pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                  ID: {currentQuestion.id}
                </span>
                {currentQuestion.source && (
                  <span className="text-[10px] bg-editorial-stone border border-editorial-border px-2 py-0.5 text-editorial-warm-taupe font-serif italic">
                    出處: {currentQuestion.source}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-warm-taupe">
                Type • {currentQuestion.type}
              </span>
            </div>

            {/* Question Stem -> Classical beautiful serif text */}
            <div className="space-y-3">
              <h1 className="font-serif text-2xl sm:text-4xl text-editorial-ink leading-[1.2] max-w-3xl">
                {currentQuestion.stem}
              </h1>
              {currentQuestion.type === QuestionType.Multiple && (
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#AA3333]" id="multi-warning">
                  * MULTIPLE CHOICE: This is a multi-select item. Click all matching selections and submit below.
                </p>
              )}
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 gap-3 max-w-2xl" id="options-selector-grid">
              {currentQuestion.type === QuestionType.YesNo ? (
                /* YES / NO layout styled as newspaper cards */
                <div className="grid grid-cols-2 gap-4" id="yesno-choice-group">
                  <button
                    onClick={() => handleOptionClick("O")}
                    disabled={isSubmitted}
                    className={`p-6 border transition-all duration-200 text-left flex flex-col justify-between h-36 rounded-none cursor-pointer ${
                      selectedAnswers.includes("O")
                        ? "border-editorial-ink bg-editorial-stone text-editorial-ink font-bold"
                        : "border-editorial-border hover:border-editorial-ink bg-white text-editorial-muted"
                    } ${isSubmitted ? "opacity-90" : "active:scale-98"}`}
                    id="option-yes-btn"
                  >
                    <span className="font-mono text-xs uppercase tracking-widest text-editorial-muted">Statement A</span>
                    <span className="font-serif text-3xl font-medium block">正確 O / YES</span>
                  </button>

                  <button
                    onClick={() => handleOptionClick("X")}
                    disabled={isSubmitted}
                    className={`p-6 border transition-all duration-200 text-left flex flex-col justify-between h-36 rounded-none cursor-pointer ${
                      selectedAnswers.includes("X")
                        ? "border-editorial-ink bg-editorial-stone text-editorial-ink font-bold"
                        : "border-editorial-border hover:border-editorial-ink bg-white text-editorial-muted"
                    } ${isSubmitted ? "opacity-90" : "active:scale-98"}`}
                    id="option-no-btn"
                  >
                    <span className="font-mono text-xs uppercase tracking-widest text-editorial-muted">Statement B</span>
                    <span className="font-serif text-3xl font-medium block">錯誤 X / NO</span>
                  </button>
                </div>
              ) : (
                /* SINGLE or MULTIPLE Choice choices */
                optionsList.map((opt) => {
                  const isSelected = selectedAnswers.includes(opt.label);
                  const isCorrectAnswer = correctAnswers.includes(opt.label);
                  
                  let elementStyle = "border-editorial-border hover:border-editorial-ink bg-white text-editorial-ink";
                  let prefixStyle = "border-editorial-border bg-editorial-stone text-editorial-muted";

                  if (isSelected) {
                    elementStyle = "border-editorial-ink bg-editorial-stone font-bold text-editorial-paper bg-editorial-ink";
                    prefixStyle = "border-white/20 bg-white/10 text-white";
                  }

                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      elementStyle = "border-[#5CB85C] bg-[#EAF7EA] text-[#2b542b] font-bold";
                      prefixStyle = "border-[#5CB85C] bg-[#5CB85C] text-white";
                    } else if (isSelected && !isCorrectAnswer) {
                      elementStyle = "border-[#D9534F] bg-[#FFF5F5] text-[#AA3333]";
                      prefixStyle = "border-[#D9534F] bg-[#D9534F] text-white";
                    } else {
                      elementStyle = "border-editorial-border/30 opacity-40 bg-white text-editorial-muted";
                    }
                  }

                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleOptionClick(opt.label)}
                      disabled={isSubmitted}
                      className={`p-5 rounded-none border text-left flex items-start gap-4 transition-all duration-150 cursor-pointer ${elementStyle}`}
                      id={`option-${opt.label}-btn`}
                    >
                      <div className={`w-6 h-6 border font-mono text-[10px] flex items-center justify-center shrink-0 font-bold ${prefixStyle}`}>
                        {opt.label}
                      </div>
                      <span className="leading-relaxed select-none text-[13px] sm:text-sm">{opt.text}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Submitted feedback / explanation panel */}
            {isSubmitted && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`p-5 rounded-none border ${
                  sessionResults[currentQuestion.id]?.isCorrect 
                    ? "bg-[#EAF7EA] border-[#5CB85C]/30 text-[#2b542b]" 
                    : "bg-[#FFF5F5] border-[#D9534F]/30 text-[#AA3333]"
                } space-y-3`}
                id="answer-feedback-panel"
              >
                <div className="flex items-center gap-2">
                  {sessionResults[currentQuestion.id]?.isCorrect ? (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2b542b]">
                      ✓ Correct Response / 答對了
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#AA3333]">
                      ✕ Incorrect Response / 答錯了
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif leading-relaxed">
                  正確解答為： 
                  <b className="mx-2 font-mono text-sm uppercase bg-white/75 border border-editorial-border py-0.5 px-2">
                    {currentQuestion.type === QuestionType.YesNo 
                      ? (correctAnswers[0] === "O" ? "正確 / O" : "錯誤 / X") 
                      : correctAnswers.join(", ")}
                  </b>
                  {selectedAnswers.length > 0 && (
                    <span className="opacity-75 italic text-[11px] block mt-1">
                      您的選擇：{selectedAnswers.join(", ")}
                    </span>
                  )}
                </p>

                {currentQuestion.explanation && (
                  <div className="mt-3 pt-3 border-t border-black/10 text-xs font-serif leading-relaxed text-black/90">
                    <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider text-editorial-warm-taupe">💡 正解與解析 Explanation：</span>
                    <p className="bg-white/50 p-3 border border-editorial-border font-serif italic text-editorial-ink">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                <p className="text-[11px] opacity-75 font-serif italic pt-1 border-t border-black/10 flex items-start gap-1">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  此題對錯已列入歷史紀錄。若本題作答錯誤，將會自動鎖定入「待複習錯題庫」，以便您在大廳隨時開啟獨立高強度重載。
                </p>
              </motion.div>
            )}

            {/* Action Buttons row */}
            <div className="flex justify-between items-center pt-6 border-t border-editorial-stone" id="test-actions-row">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">
                Matched: {(Object.values(sessionResults) as Array<{ isCorrect: boolean; answers: string[] }>).filter(r => r.isCorrect).length} of {totalQuestions}
              </span>

              <div className="flex gap-3">
                {currentQuestion.type === QuestionType.Multiple && !isSubmitted && (
                  <button
                    onClick={handlesMultiSubmit}
                    disabled={selectedAnswers.length === 0}
                    className={`bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 transition duration-200 ${
                      selectedAnswers.length === 0 ? "opacity-30 cursor-not-allowed" : "active:scale-95 cursor-pointer"
                    }`}
                    id="submit-multi-choice-btn"
                  >
                    確定提交答案 ({selectedAnswers.length})
                  </button>
                )}

                {isSubmitted && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setSelectedAnswers([]);
                        const newResults = { ...sessionResults };
                        delete newResults[currentQuestion.id];
                        setSessionResults(newResults);
                      }}
                      className="bg-white hover:bg-editorial-stone text-editorial-ink border border-editorial-ink text-[10px] font-bold uppercase tracking-widest py-3 px-5 transition duration-150 flex items-center gap-1 active:scale-95 cursor-pointer"
                      id="btn-retry-individual-question"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                      重新作答 Retry
                    </button>

                    <button
                      onClick={handleNext}
                      className="bg-[#1A1A1A] hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest py-3 px-6 transition duration-150 flex items-center gap-2 active:scale-95 cursor-pointer"
                      id="btn-next-question"
                    >
                      {currentIndex === totalQuestions - 1 ? "完成並查看報告 Finish" : "下一題 Next Question"}
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // SCORE SUMMARY / REPORT STYLE
  return (
    <div className="max-w-2xl mx-auto bg-white border border-editorial-border p-8 sm:p-12 text-center shadow-md space-y-8" id="test-report-card">
      <div className="relative inline-block" id="report-award-icon">
        <div className="p-6 bg-editorial-stone text-editorial-ink border border-editorial-ink inline-block">
          <Award className="w-12 h-12 stroke-[1]" />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#888] block">
          Review Complete / 考題測驗結束
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-editorial-ink italic">成績報告書</h2>
      </div>

      {/* Accuracy meter */}
      <div className="border border-editorial-ink grid grid-cols-3 divide-x divide-editorial-ink bg-editorial-stone/40" id="score-stats-grid">
        <div className="p-4 text-center">
          <p className="text-[9px] text-[#888] font-bold uppercase tracking-widest">Total Tested</p>
          <p className="font-serif text-2xl font-bold text-editorial-ink mt-2">{totalQuestions} 題</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[9px] text-[#2b542b] font-bold uppercase tracking-widest">Corrected</p>
          <p className="font-serif text-2xl font-bold text-[#2b542b] mt-2">{correctCount} 題</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[9px] text-[#AA3333] font-bold uppercase tracking-widest">Incorrect</p>
          <p className="font-serif text-2xl font-bold text-[#AA3333] mt-2">{wrongCount} 題</p>
        </div>
      </div>

      {/* Session Accuracy Bar */}
      <div className="space-y-2 text-left bg-editorial-stone p-5 border border-editorial-border" id="report-accuracy-bar">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Overall Accuracy Rate</span>
          <span className="font-serif italic text-lg text-editorial-ink font-bold">{finalPercentage}%</span>
        </div>
        <div className="w-full bg-[#E5E5E1] h-2">
          <div 
            className="h-full bg-editorial-ink transition-all duration-1000"
            style={{ width: `${finalPercentage}%` }}
          />
        </div>
      </div>

      {/* Motivational message */}
      <div className="text-xs text-editorial-muted leading-relaxed font-serif italic max-w-md mx-auto">
        {finalPercentage === 100 ? (
          <span className="text-[#2b542b] font-bold">✨ 卓越非凡！您達成了 100% 的完美作答紀錄！</span>
        ) : wrongCount > 0 ? (
          <span>
            本次測驗未能全對，其中 <b>{wrongCount}</b> 題答錯之卡片已被自動移置於您的「待複習錯題庫」中。建議您直接點擊下方「錯題重測」進行精實的考前消滅。
          </span>
        ) : (
          <span>測試已完整歸檔，請回到主控大廳並嘗試更有挑戰性的隨機抽題！</span>
        )}
      </div>

      {/* Action choices for exiting */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-editorial-stone" id="report-action-buttons">
        {wrongCount > 0 && (
          <button
            onClick={() => {
              const failedIds = Object.keys(sessionResults).filter(qid => !sessionResults[qid].isCorrect);
              const failedQuestions = questions.filter(q => failedIds.includes(q.id));
              setCurrentIndex(0);
              setSelectedAnswers([]);
              setIsSubmitted(false);
              setSessionResults({});
              setIsFinished(false);
              onFinishSession(sessionResults); // commit report data upstream first
            }}
            className="flex-1 py-4 bg-[#D9534F] hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest transition duration-200 cursor-pointer"
            id="btn-instant-retest"
          >
            立即錯題重測 Retest Wrong Only
          </button>
        )}

        <button
          onClick={handleFinish}
          className="flex-1 py-4 bg-editorial-ink hover:bg-editorial-muted text-white text-[10px] font-bold uppercase tracking-widest transition duration-200 cursor-pointer"
          id="btn-report-back"
        >
          儲存並返回 Exit to Lobby
        </button>
      </div>
    </div>
  );
}
