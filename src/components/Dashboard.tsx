/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  History, 
  BookmarkCheck,
  Flame,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Question, UserStats, TestMode } from "../types";

interface DashboardProps {
  questions: Question[];
  stats: UserStats;
  onStartTest: (mode: TestMode, limit?: number) => void;
  onResetStats: () => void;
}

export default function Dashboard({ questions, stats, onStartTest, onResetStats }: DashboardProps) {
  const totalQuestions = questions.length;
  const wrongCount = Object.keys(stats.wrongRecords).length;
  const answeredCount = stats.totalAnswered;
  
  // Calculate historical accuracy
  const accuracy = answeredCount > 0 
    ? Math.round((stats.totalCorrect / answeredCount) * 100) 
    : 0;

  // Group latest histories
  const sortedHistory = [...stats.history]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Editorial Main Title Banner */}
      <div 
        className="bg-white border-y border-editorial-ink py-10 px-2 flex flex-col md:flex-row md:items-end justify-between gap-8"
        id="dashboard-header"
      >
        <div className="space-y-3 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-editorial-warm-taupe block">
            Course Module Assessment / 學習大廳
          </span>
          <h2 className="text-3xl md:text-5xl font-serif text-editorial-ink font-normal leading-tight">
            會考各科智慧題庫與測驗
          </h2>
          <p className="text-xs text-editorial-muted leading-relaxed font-serif italic">
            系統精細追蹤所有答错選項，獨立成「錯題加強重測券」重考機制。在紙質觸感的美學排版之中，穩健熟記、反覆自我考驗直到 100% 正確為止。
          </p>
        </div>

        {/* Start Button Group -> Editorial style: blocky, uppercase, tracking */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => onStartTest(TestMode.All)}
            className="flex items-center gap-2.5 bg-editorial-ink text-white hover:bg-editorial-muted tracking-widest uppercase text-[10px] font-bold px-6 py-4 rounded-none transition duration-200 shadow-sm cursor-pointer"
            id="btn-all-test"
          >
            <Play className="w-3.5 h-3.5 stroke-[2] fill-current" />
            全部題庫測驗 Start test
          </button>

          <button
            onClick={() => onStartTest(TestMode.Random, 10)}
            className="flex items-center gap-2 bg-white text-editorial-ink hover:bg-editorial-stone border border-editorial-ink tracking-widest uppercase text-[10px] font-bold px-5 py-4 rounded-none transition duration-200 cursor-pointer"
            id="btn-quick-10"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            快速挑戰十題 Quick 10
          </button>
        </div>
      </div>

      {/* Stats Cards Grid -> Simple borders, no-rounded, blocky font */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-editorial-border" id="stats-grid">
        {/* Total Bank */}
        <div className="bg-white p-6 border-r border-b border-editorial-border flex flex-col justify-between" id="stat-total-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">System Bank Size</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-serif italic text-3xl font-semibold">{totalQuestions}</span>
            <span className="text-[10px] uppercase font-bold text-editorial-muted">Questions</span>
          </div>
        </div>

        {/* Answered */}
        <div className="bg-white p-6 border-r border-b border-editorial-border flex flex-col justify-between" id="stat-answered-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Total Answer Attempts</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-serif italic text-3xl font-semibold">{answeredCount}</span>
            <span className="text-[10px] uppercase font-bold text-editorial-muted">Times</span>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white p-6 border-r border-b border-editorial-border flex flex-col justify-between" id="stat-accuracy-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Current Accuracy Rate</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-serif italic text-3xl font-bold text-editorial-ink">{accuracy}%</span>
              <span className="text-[10px] uppercase font-bold text-editorial-muted">Success</span>
            </div>
            <div className="w-full bg-[#E5E5E1] h-1.5 rounded-none relative overflow-hidden">
              <div 
                className="bg-editorial-ink h-full transition-all duration-700"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wrong count (HIGHLIGHTED RED FLAGGED ERROR BLOCK) */}
        <div 
          className={`p-6 border-r border-b border-editorial-border flex flex-col justify-between transition-colors ${
            wrongCount > 0 
              ? "bg-[#FFF5F5]" 
              : "bg-white"
          }`}
          id="stat-wrong-card"
        >
          <div className="flex justify-between items-start">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${wrongCount > 0 ? "text-[#D9534F]" : "text-[#888]"}`}>
              Incorrect Review Queue
            </p>
            {wrongCount > 0 && <span className="w-2 h-2 rounded-full bg-[#D9534F] animate-pulse"></span>}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className={`font-serif italic text-3xl font-bold ${wrongCount > 0 ? "text-[#D9534F]" : "text-editorial-ink"}`}>
              {wrongCount}
            </span>

            {wrongCount > 0 && (
              <button
                onClick={() => onStartTest(TestMode.IncorrectOnly)}
                className="bg-[#D9534F] hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-widest py-2 px-3 transition duration-200 shrink-0 cursor-pointer"
                id="btn-retest-errors"
              >
                錯題重測 Re-Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Info/Modes, Right is Mistakes Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-layout-main">
        {/* Left Section - Quick Start Panel */}
        <div className="lg:col-span-7 space-y-6" id="dashboard-choices">
          <div className="bg-white border border-editorial-border p-8 space-y-6" id="modes-card">
            <div className="border-b border-editorial-border pb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] mb-1">
                Select Assessment Type
              </h3>
              <p className="font-serif text-2xl text-editorial-ink italic">分門別類，多重演練模式</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sequential Mode Card */}
              <div 
                onClick={() => onStartTest(TestMode.Sequential)}
                className="border border-editorial-border p-5 rounded-none hover:border-editorial-ink bg-[#FDFCFB] hover:bg-white transition-all cursor-pointer flex flex-col justify-between h-40 group"
                id="mode-seq-card"
              >
                <div>
                  <h4 className="font-serif text-lg italic text-editorial-ink group-hover:underline">
                    循序逐題模式
                  </h4>
                  <p className="text-xs text-editorial-muted mt-2 leading-relaxed">
                    依題庫編號 (E001 起) 順著推進，適合第一次熟悉題集、由淺入深的漸進讀題。
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-editorial-muted group-hover:text-editorial-ink pt-3 border-t border-editorial-stone">
                  <span>Sequential order</span>
                  <span>Go &rarr;</span>
                </div>
              </div>

              {/* Random Mode Card */}
              <div 
                onClick={() => onStartTest(TestMode.Random)}
                className="border border-editorial-border p-5 rounded-none hover:border-editorial-ink bg-[#FDFCFB] hover:bg-white transition-all cursor-pointer flex flex-col justify-between h-40 group"
                id="mode-rand-card"
              >
                <div>
                  <h4 className="font-serif text-lg italic text-editorial-ink group-hover:underline">
                    隨機亂序抽測
                  </h4>
                  <p className="text-xs text-editorial-muted mt-2 leading-relaxed">
                    不拘題目次序隨機挑題。打散編號提示關聯，高強度鍛鍊真實考試時的臨場反應。
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-editorial-muted group-hover:text-editorial-ink pt-3 border-t border-editorial-stone">
                  <span>Randomized Card</span>
                  <span>Shuffle &rarr;</span>
                </div>
              </div>

              {/* High Intensity Retest */}
              <div 
                onClick={() => {
                  if (wrongCount > 0) {
                    onStartTest(TestMode.IncorrectOnly);
                  }
                }}
                className={`border p-5 rounded-none transition-all flex flex-col justify-between h-40 group ${
                  wrongCount > 0 
                    ? "border-[#D9534F] bg-[#FFF5F5]/40 hover:bg-[#FFF5F5] cursor-pointer" 
                    : "border-editorial-border opacity-50 cursor-not-allowed"
                }`}
                id="mode-err-card"
              >
                <div>
                  <h4 className={`font-serif text-lg italic ${wrongCount > 0 ? "text-[#D9534F] group-hover:underline" : "text-editorial-muted"}`}>
                    獨立錯題再戰
                  </h4>
                  <p className="text-xs text-editorial-muted mt-2 leading-relaxed">
                    只抽取目前「曾答錯的所有重點題目」組合出擊。逐個攻克並全數消滅才算完。
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pt-3 border-t border-editorial-stone">
                  <span className={wrongCount > 0 ? "text-[#D9534F]" : "text-editorial-muted"}>
                    {wrongCount > 0 ? `Unresolved: ${wrongCount} items` : "No mistakes pending"}
                  </span>
                  {wrongCount > 0 && <span className="text-[#D9534F]">Retest &rarr;</span>}
                </div>
              </div>

              {/* Single Question Instant Card Mode */}
              <div 
                onClick={() => onStartTest(TestMode.All, undefined)}
                className="border border-editorial-border p-5 rounded-none hover:border-editorial-ink bg-[#FDFCFB] hover:bg-white transition-all cursor-pointer flex flex-col justify-between h-40 group"
                id="mode-card-explore"
              >
                <div>
                  <h4 className="font-serif text-lg italic text-editorial-ink group-hover:underline">
                    即答即看閃卡
                  </h4>
                  <p className="text-xs text-editorial-muted mt-2 leading-relaxed">
                    對單題進行闖關演練，送出作答後立刻看到對錯與正確答案，吸收速度加倍。
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-editorial-muted group-hover:text-editorial-ink pt-3 border-t border-editorial-stone">
                  <span>Flashcard mode</span>
                  <span>View &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Practice History / Mistakes List */}
        <div className="lg:col-span-5 space-y-6" id="dashboard-logs">
          {/* History Records */}
          <div className="bg-white border border-editorial-border p-6 flex flex-col space-y-4" id="history-log-card">
            <div className="border-b border-editorial-border pb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
                Recent Achievements Logs
              </h3>
              <span className="font-mono text-[9px] text-editorial-muted bg-editorial-stone px-2 py-0.5 uppercase">Live update</span>
            </div>

            {sortedHistory.length === 0 ? (
              <div className="py-12 text-center text-editorial-muted space-y-2 flex flex-col items-center justify-center">
                <HelpCircle className="w-8 h-8 text-editorial-border" />
                <span className="font-serif italic text-sm">目前尚無作答統計紀錄。</span>
                <span className="text-[10px] uppercase tracking-wider">Please initiate your first test above.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" id="history-items-container">
                {sortedHistory.map((item, index) => {
                  const correlatedQuest = questions.find(q => q.id === item.questionId);
                  const questTitle = correlatedQuest 
                    ? `[${correlatedQuest.type}] ${correlatedQuest.stem}`
                    : `題目 ${item.questionId}`;
                    
                  return (
                    <div 
                      key={index}
                      className="text-xs p-4 rounded-none bg-[#FDFCFB] border border-editorial-border flex items-start justify-between gap-4 hover:bg-editorial-stone transition-all duration-200"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold flex items-center gap-2 text-editorial-ink">
                          <span className="font-mono text-[9px] border border-editorial-ink px-1.5 py-0.2">
                            {item.questionId}
                          </span>
                          <span className="truncate max-w-[120px] sm:max-w-[180px] block" title={questTitle}>{questTitle}</span>
                        </p>
                        <p className="text-[9px] text-[#80807c] font-mono">
                          {new Date(item.timestamp).toLocaleTimeString("zh-TW")}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                          item.isCorrect 
                            ? "bg-[#EAF7EA] text-[#2b542b] border border-[#d6eed6]" 
                            : "bg-[#FFF5F5] text-[#AA3333] border border-[#FFCCCC]"
                        }`}>
                          {item.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-[9px] text-[#A69D91] font-mono">
                          Selected: {item.selectedAnswers.join("") || "Nil"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset Control Utility */}
          <div className="bg-[#F5F5F0] rounded-none p-5 border border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-4" id="reset-zone">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">Clear Memory Stats</h4>
              <p className="text-[11px] text-editorial-muted leading-relaxed font-serif italic">完全重設並歸零答題對錯統計、歷史歷程與答錯暫存數據。</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("您確定要將作答紀錄完全重設並歸零所有錯題庫嗎？這項動作無法還原。")) {
                  onResetStats();
                }
              }}
              className="px-4 py-2 bg-white border border-[#D9534F] hover:bg-[#D9534F] hover:text-white text-[#D9534F] hover:shadow-sm text-[10px] font-bold uppercase tracking-widest transition duration-200 shrink-0 cursor-pointer"
              id="btn-confirm-reset"
            >
              完全重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
