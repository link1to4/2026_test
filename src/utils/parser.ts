/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, QuestionType } from "../types";

/**
 * Parses a single option and stem from question content.
 * e.g., "測試單選題？(1)答案A (2)答案B (3)答案C (4)以上皆是"
 * returns stem: "測試單選題？", options: ["答案A", "答案B", "答案C", "以上皆是"]
 */
export function parseOptionsAndStem(content: string): { stem: string; options: string[] } {
  const trimmedContent = content.trim();

  // Try to find options starting with parenthesized numbers like (1) or （1）
  const standardRegex = /\((\d+)\)|（(\d+)）/g;
  const matches: { index: number; text: string; num: number }[] = [];
  let match;

  while ((match = standardRegex.exec(trimmedContent)) !== null) {
    const numStr = match[1] || match[2];
    matches.push({
      index: match.index,
      text: match[0],
      num: parseInt(numStr, 10),
    });
  }

  // Backup option format 1: "1." or "A." or "A)" or "1)"
  if (matches.length === 0) {
    const dotRegex = /(?:\b|^)(\d+)\.|\b([A-Da-d])\./g;
    while ((match = dotRegex.exec(trimmedContent)) !== null) {
      const isDigit = !!match[1];
      const valStr = match[1] || match[2];
      const val = isDigit ? parseInt(valStr, 10) : valStr.toUpperCase().charCodeAt(0) - 64;
      matches.push({
        index: match.index,
        text: match[0],
        num: val,
      });
    }
  }

  // Backup option format 2: Circled numbers ①, ②, ③, ④...
  if (matches.length === 0) {
    const circledMap: Record<string, number> = {
      "①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5, "⑥": 6, "⑦": 7, "⑧": 8, "⑨": 9, "⑩": 10
    };
    const circleRegex = /[①②③④⑤⑥⑦⑧⑨⑩]/g;
    while ((match = circleRegex.exec(trimmedContent)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        num: circledMap[match[0]] || 0,
      });
    }
  }

  // If we found zero option indicators, there are no separate options (standard for YES_NO questions)
  if (matches.length === 0) {
    return { stem: trimmedContent, options: [] };
  }

  // Sort matches chronologically by their position inside the string
  matches.sort((a, b) => a.index - b.index);

  // The stem is everything preceding the first option marker
  const stem = trimmedContent.substring(0, matches[0].index).trim();

  // Extract each option's text
  const options: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].text.length;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : trimmedContent.length;
    options.push(trimmedContent.substring(start, end).trim());
  }

  return { stem: stem || "無題目敘述", options };
}

/**
 * Normalizes and parses the correct answers based on the question type.
 */
export function parseAnswers(type: QuestionType, rawAnswer: string): string[] {
  const trimmed = rawAnswer.trim();

  if (type === QuestionType.YesNo) {
    // Normalise True/False indicators: O, T, 1, 是 -> "O"; X, F, 2, 否 -> "X"
    const val = trimmed.toUpperCase();
    if (val === "O" || val === "T" || val === "1" || val === "是" || val === "正確") {
      return ["O"];
    }
    return ["X"];
  }

  if (type === QuestionType.Single) {
    // Single choice answer is just a single string indicating the options index (usually "1", "2" etc.)
    return [trimmed];
  }

  // Multiple Choice (複選題): "12" -> ["1", "2"]
  // If comma/semicolon/space separated, split by them. E.g., "1,2,3" -> ["1", "2", "3"]
  if (trimmed.includes(",") || trimmed.includes(";") || trimmed.includes("/")) {
    return trimmed.split(/[,;\s/]+/).map(s => s.trim()).filter(Boolean);
  }

  // If multiple digits like "134" -> ["1", "3", "4"]
  if (/^\d+$/.test(trimmed)) {
    return trimmed.split("");
  }

  return [trimmed];
}

/**
 * Parses a bulk copy-pasted string or tab-separated structure into Question objects.
 * Expects 4 columns: 編號    題型    答案    題目內容
 */
export function parseQuestionLines(text: string): Question[] {
  const lines = text.split(/\r?\n/);
  const questions: Question[] = [];

  // Match: [ID] [Type] [Answer] [Content]
  // Pattern accommodates custom spaces/tabs and different IDs
  const linePattern = /^\s*([a-zA-Z0-9_-]+)\s+(是非題|單選題|複選題)\s+([oOxXTtFfXxeEsS0-9,;/]+)\s+(.+)$/;

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (!cleanedLine || cleanedLine.startsWith("編號")) {
      continue; // Skip empty lines and headers
    }

    const match = linePattern.exec(cleanedLine);
    if (match) {
      const id = match[1];
      const typeStr = match[2];
      const rawAnswer = match[3];
      const rawContent = match[4];

      let type = QuestionType.Single;
      if (typeStr === "是非題") type = QuestionType.YesNo;
      else if (typeStr === "複選題") type = QuestionType.Multiple;

      const parsed = parseOptionsAndStem(rawContent);
      const parsedAnswers = parseAnswers(type, rawAnswer);

      questions.push({
        id,
        type,
        rawContent,
        stem: parsed.stem,
        options: parsed.options,
        answer: rawAnswer,
        parsedAnswers,
      });
    } else {
      // Robust fallback partition for imperfect paste
      // Splitting by multiple spaces/tabs
      const parts = cleanedLine.split(/\t+|\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        const id = parts[0];
        const typeStr = parts[1];
        const rawAnswer = parts[2];
        // Combine remaining parts in case they got split
        const rawContent = parts.slice(3).join("  ");

        let type = QuestionType.Single;
        if (typeStr === "是非題") type = QuestionType.YesNo;
        else if (typeStr === "複選題") type = QuestionType.Multiple;

        const parsed = parseOptionsAndStem(rawContent);
        const parsedAnswers = parseAnswers(type, rawAnswer);

        questions.push({
          id,
          type,
          rawContent,
          stem: parsed.stem,
          options: parsed.options,
          answer: rawAnswer,
          parsedAnswers,
        });
      }
    }
  }

  return questions;
}
