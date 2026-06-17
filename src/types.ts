/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum QuestionType {
  YesNo = "是非題",
  Single = "單選題",
  Multiple = "複選題",
}

export interface Question {
  id: string;        // E001, E013, etc.
  type: QuestionType;
  rawContent: string; // The complete raw text line (content + options)
  stem: string;       // The parsed question description (e.g. "測試單選題？")
  options: string[];  // The parsed options list (e.g. ["答案A", "答案B", "答案C", "以上皆是"])
  answer: string;     // The raw answer string (e.g. "O", "4", "12")
  parsedAnswers: string[]; // Parsed standard answers (e.g. ["O"] for YesNo, ["4"] for Single, ["1", "2"] for Multiple)
}

export interface WrongRecord {
  questionId: string;
  incorrectCount: number;
  lastAttemptAt: string;
  userAnswers: string[]; // Answers provided during the last failed attempt
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  wrongRecords: Record<string, WrongRecord>; // questionId -> WrongRecord
  history: AttemptHistory[];
}

export interface AttemptHistory {
  timestamp: string;
  questionId: string;
  isCorrect: boolean;
  selectedAnswers: string[];
}

export enum TestMode {
  All = "ALL",          // 全部題庫練習
  Sequential = "SEQ",   // 循序練習
  Random = "RAND",      // 隨機抽題練習
  IncorrectOnly = "ERR" // 錯題重測複習
}

export interface SessionState {
  questions: Question[];
  currentIndex: number;
  userAnswers: string[]; // Current selected options (e.g. ["1"] or ["1", "3"])
  submitted: boolean;    // Has the current question been submitted (for instant reveal feedback)
  results: Record<string, { isCorrect: boolean; answers: string[] }>; // Answers saved in current session
  mode: TestMode;
}
