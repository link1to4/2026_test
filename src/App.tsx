/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  BookOpen, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle, 
  X,
  Plus,
  ArrowRight,
  ClipboardList,
  Flame,
  Shuffle
} from "lucide-react";
import { Question, QuestionType, UserStats, TestMode, SessionState } from "./types";
import { defaultQuestions } from "./data/defaultQuestions";
import { parseCSVQuestions } from "./utils/parser";
import Dashboard from "./components/Dashboard";
import TestArea from "./components/TestArea";
import QuestionList from "./components/QuestionList";

const STORAGE_QUESTIONS_KEY = "quiz_practice_questions";
const STORAGE_STATS_KEY = "quiz_practice_stats_v2";

export default function App() {
  // 1. Core Persistent States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    wrongRecords: {},
    history: []
  });

  // 2. Navigation State: 'dashboard' | 'test' | 'questions'
  const [activeTab, setActiveTab] = useState<"dashboard" | "test" | "questions">("dashboard");

  // 3. Active Test / Session State
  const [activeSession, setActiveSession] = useState<SessionState | null>(null);

  // Load from LocalStorage or CSV on mount
  useEffect(() => {
    const cachedStats = localStorage.getItem(STORAGE_STATS_KEY);
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        // use default empty stats
      }
    }

    const cachedQuestions = localStorage.getItem(STORAGE_QUESTIONS_KEY);
    if (cachedQuestions) {
      try {
        const parsed = JSON.parse(cachedQuestions);
        if (parsed.length === 0) {
          // If empty, auto-load from ./tests.csv
          fetch("./tests.csv")
            .then((res) => res.text())
            .then((text) => {
              const csvQuestions = parseCSVQuestions(text);
              if (csvQuestions.length > 0) {
                setQuestions(csvQuestions);
                localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(csvQuestions));
              } else {
                setQuestions([]);
              }
            })
            .catch((err) => {
              console.error("Error fetching tests.csv", err);
              setQuestions([]);
            });
        } else {
          setQuestions(parsed);
        }
      } catch (e) {
        setQuestions([]);
      }
    } else {
      // First boot: fetch tests.csv
      fetch("./tests.csv")
        .then((res) => res.text())
        .then((text) => {
          const csvQuestions = parseCSVQuestions(text);
          if (csvQuestions.length > 0) {
            setQuestions(csvQuestions);
            localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(csvQuestions));
          } else {
            setQuestions([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching tests.csv", err);
          setQuestions([]);
        });
    }
  }, []);

  // Save questions when changed
  const saveQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(newQuestions));
  };

  // Save Stats when changed
  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(newStats));
  };

  // 4. State mutator callbacks

  // Trigger test start
  const handleStartTest = (mode: TestMode, limit?: number) => {
    let quizPool: Question[] = [];

    switch (mode) {
      case TestMode.All:
      case TestMode.Sequential:
        quizPool = [...questions];
        break;
      
      case TestMode.Random:
        // Shuffle all questions
        quizPool = [...questions].sort(() => Math.random() - 0.5);
        if (limit && limit > 0) {
          quizPool = quizPool.slice(0, limit);
        }
        break;

      case TestMode.IncorrectOnly:
        // Filter questions with wrong records
        const wrongIds = Object.keys(stats.wrongRecords);
        quizPool = questions.filter(q => wrongIds.includes(q.id));
        break;
    }

    // Sort sequential if sequential
    if (mode === TestMode.Sequential) {
      quizPool.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
    }

    if (quizPool.length === 0) {
      alert(mode === TestMode.IncorrectOnly ? "恭喜您！目前沒有待複習的錯題庫。" : "題庫中沒有符合條件的題目，請先新增題目！");
      return;
    }

    setActiveSession({
      questions: quizPool,
      currentIndex: 0,
      userAnswers: [],
      submitted: false,
      results: {},
      mode
    });

    setActiveTab("test");
  };

  // Handle answers completed for a test session
  const handleFinishSession = (sessionResults: Record<string, { isCorrect: boolean; answers: string[] }>) => {
    // Merge session results into overall stats
    const updatedStats = { ...stats };
    const now = new Date().toISOString();

    Object.entries(sessionResults).forEach(([qid, res]) => {
      // 1. Update basic history log
      updatedStats.history.push({
        timestamp: now,
        questionId: qid,
        isCorrect: res.isCorrect,
        selectedAnswers: res.answers
      });

      // 2. Update stats tallies
      updatedStats.totalAnswered += 1;
      if (res.isCorrect) {
        updatedStats.totalCorrect += 1;

        // Keep the question in the wrongRecords pool even when answered correctly
        // to allow continued review/re-testing ("答錯的題目 重測答對後也要可以重新作答").
        if (updatedStats.wrongRecords[qid]) {
          updatedStats.wrongRecords[qid].lastAttemptAt = now;
        }
      } else {
        updatedStats.totalWrong += 1;

        // Add or increment wrong feedback record
        if (updatedStats.wrongRecords[qid]) {
          updatedStats.wrongRecords[qid] = {
            questionId: qid,
            incorrectCount: updatedStats.wrongRecords[qid].incorrectCount + 1,
            lastAttemptAt: now,
            userAnswers: res.answers
          };
        } else {
          updatedStats.wrongRecords[qid] = {
            questionId: qid,
            incorrectCount: 1,
            lastAttemptAt: now,
            userAnswers: res.answers
          };
        }
      }
    });

    saveStats(updatedStats);
    setActiveSession(null);
    setActiveTab("dashboard");
  };

  // Reset entire learning record (O/X wrong registers, counters)
  const handleResetStats = () => {
    const resetValues: UserStats = {
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      wrongRecords: {},
      history: []
    };
    saveStats(resetValues);
  };

  // Add bulk or manual questions to library
  const handleAddQuestions = (newQuests: Question[]) => {
    const updated = [...questions, ...newQuests];
    saveQuestions(updated);
  };

  // Delete single question
  const handleDeleteQuestion = (id: string) => {
    // 1. Remove from question list
    const updatedQuests = questions.filter(q => q.id !== id);
    saveQuestions(updatedQuests);

    // 2. Remove any associated wrong records
    if (stats.wrongRecords[id]) {
      const updatedStats = { ...stats };
      delete updatedStats.wrongRecords[id];
      saveStats(updatedStats);
    }
  };

  // Exempt a single question from wrong database tracker manually
  const handleClearWrongRecord = (id: string) => {
    if (stats.wrongRecords[id]) {
      const updatedStats = { ...stats };
      delete updatedStats.wrongRecords[id];
      saveStats(updatedStats);
    }
  };

  // Sync/Reload from tests.csv
  const handleSyncFromCSV = () => {
    if (window.confirm("您確定要從 ./tests.csv 重新載入所有題庫嗎？這將會覆寫當前本機的題庫內容。")) {
      fetch("./tests.csv")
        .then((res) => res.text())
        .then((text) => {
          const csvQuestions = parseCSVQuestions(text);
          if (csvQuestions.length > 0) {
            saveQuestions(csvQuestions);
            alert(`成功！已成功從 tests.csv 載入並同步 ${csvQuestions.length} 題題目！`);
          } else {
            alert("讀取 csv 內容時未偵測到有效題目，請確認 CSV 格式。");
          }
        })
        .catch((err) => {
          console.error(err);
          alert("無法連線讀取 ./tests.csv 資料，請確認檔案格式或連線。");
        });
    }
  };

  // Complete clean trigger
  const handleClearLibraryOnly = () => {
    if (window.confirm("您確定要將當前所有的題目完全清空嗎？清空後系統將呈現空白狀態。")) {
      saveQuestions([]);
      alert("題庫已成功完全清空！");
    }
  };

  const totalWrongCount = Object.keys(stats.wrongRecords).length;

  return (
    <div className="min-h-screen bg-editorial-paper text-editorial-ink flex flex-col font-sans selection:bg-editorial-stone" id="main-applet-root">
      {/* GLOBAL HIGH-CONTRAST ACCENT HEADER */}
      <header className="bg-editorial-paper border-b border-editorial-border sticky top-0 z-40" id="header-brand-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & title brand markup with Editorial typography */}
          <div 
            onClick={() => { if (activeTab !== "test") setActiveTab("dashboard"); }}
            className="flex items-center gap-6 cursor-pointer group"
            id="brand-mark"
          >
            <div className="border border-editorial-ink text-editorial-ink bg-white p-2.5 rounded-none shadow-sm group-hover:bg-editorial-ink group-hover:text-white transition-all duration-300">
              <Trophy className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="text-xs font-bold uppercase tracking-widest text-editorial-muted">Assessment Bank</h1>
              <div className="h-3 w-px bg-editorial-border hidden sm:block"></div>
              <span className="font-serif italic text-lg leading-tight text-editorial-ink hidden sm:block">
                會考題庫與測驗
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2" id="tab-navigation">
            {activeTab !== "test" ? (
              <>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer border ${
                    activeTab === "dashboard"
                      ? "bg-editorial-ink text-white border-editorial-ink"
                      : "text-editorial-muted hover:text-editorial-ink border-transparent hover:border-editorial-border bg-transparent"
                  }`}
                  id="tab-btn-dashboard"
                >
                  控制大廳 / Dashboard
                </button>

                <button
                  onClick={() => setActiveTab("questions")}
                  className={`px-4 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                    activeTab === "questions"
                      ? "bg-editorial-ink text-white border-editorial-ink"
                      : "text-editorial-muted hover:text-editorial-ink border-transparent hover:border-editorial-border bg-transparent"
                  }`}
                  id="tab-btn-questions"
                >
                  <BookOpen className="w-3.5 h-3.5 stroke-[1.5]" />
                  題庫管理 / Database
                </button>
              </>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-widest text-editorial-error px-3 py-1.5 bg-rose-50 border border-editorial-error/20 inline-flex items-center gap-2" id="nav-mode-playing">
                <span className="w-1.5 h-1.5 rounded-full bg-editorial-error animate-ping"></span>
                測驗進行中 Review Session
              </span>
            )}
          </nav>
        </div>
      </header>

      {/* CORE WORKSPACE STAGE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10" id="application-body">
        
        {/* VIEW 1: DASHBOARD CONSOLE */}
        {activeTab === "dashboard" && (
          <Dashboard
            questions={questions}
            stats={stats}
            onStartTest={handleStartTest}
            onResetStats={handleResetStats}
          />
        )}

        {/* VIEW 2: QUIZ PRACTICE ROUND */}
        {activeTab === "test" && activeSession && (
          <TestArea
            questions={activeSession.questions}
            mode={activeSession.mode}
            onFinishSession={handleFinishSession}
            onExit={() => {
              if (window.confirm("測驗尚未全部作答完畢，確定要提早退場回到大廳嗎？(本次已填寫之答題紀錄依然會被計算在歷程中)")) {
                // Submit progress so far
                handleFinishSession(activeSession.results);
              }
            }}
          />
        )}

        {/* VIEW 3: QUESTION DATABASE MANAGER WITH BULK EXPORTER */}
        {activeTab === "questions" && (
          <div className="space-y-6" id="questions-manager-section">
            <QuestionList
              questions={questions}
              stats={stats}
              onAddQuestions={handleAddQuestions}
              onDeleteQuestion={handleDeleteQuestion}
              onClearWrongRecord={handleClearWrongRecord}
            />

            {/* CSV Sync and Clear databases panel */}
            <div className="bg-editorial-stone rounded-none border border-editorial-border p-6 flex flex-col md:flex-row items-center justify-between gap-6" id="restore-default-panel">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-ink">本機題庫重設與 CSV 同步設定</h4>
                <p className="text-xs text-editorial-muted">
                  您可以自 <code className="bg-white/80 px-1 py-0.5 rounded text-mono font-bold font-mono">./tests.csv</code> 格式化檔案重新載入或將本機練習題庫完全清空。
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleSyncFromCSV}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-editorial-ink hover:bg-editorial-ink hover:text-white text-[10px] font-bold uppercase tracking-widest text-editorial-ink transition duration-200 rounded-none cursor-pointer"
                  id="btn-sync-csv"
                >
                  從 tests.csv 重新載入題庫 Sync CSV
                </button>
                <button
                  type="button"
                  onClick={handleClearLibraryOnly}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#D9534F] hover:bg-[#D9534F] hover:text-white text-[10px] font-bold uppercase tracking-widest text-[#D9534F] transition duration-200 rounded-none cursor-pointer"
                  id="btn-trigger-restore"
                >
                  清空本機題庫 Clear Library
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-editorial-stone border-t border-editorial-border py-8 mt-16 shrink-0 select-none" id="footer-branding">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-editorial-muted font-sans leading-relaxed text-center md:text-left">
            會考題庫與測驗系統 © 2026 智慧學成平台 | 支援是非題 (O/X)、單選題 (1-4)、多重選題 (多碼核對) 
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-editorial-muted">
              庫存: {questions.length} 題 &bull; 錯題累計: {totalWrongCount} 題
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#888]">Secure Environment</span>
              <div className="w-2 h-2 rounded-full bg-editorial-success"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
