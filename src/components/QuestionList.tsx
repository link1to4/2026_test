/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckCircle,
  XCircle,
  ListFilter,
  AlertCircle,
  RefreshCcw,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Question, QuestionType, UserStats } from "../types";
import { parseQuestionLines } from "../utils/parser";

interface QuestionListProps {
  questions: Question[];
  stats: UserStats;
  onAddQuestions: (newQuests: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
  onClearWrongRecord: (id: string) => void;
}

export default function QuestionList({
  questions,
  stats,
  onAddQuestions,
  onDeleteQuestion,
  onClearWrongRecord,
}: QuestionListProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  // Manual Add Form states
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualType, setManualType] = useState<QuestionType>(QuestionType.Single);
  const [manualStem, setManualStem] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>(["", "", "", ""]);
  const [manualSource, setManualSource] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");
  const [manualErrorMsg, setManualErrorMsg] = useState("");

  // Bulk Paste Form states
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkErrorMsg, setBulkErrorMsg] = useState("");
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.rawContent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedTypeFilter === "ALL" || q.type === selectedTypeFilter;
    
    const isWrong = Object.keys(stats.wrongRecords).includes(q.id);
    const matchesWrongOnly = !showOnlyWrong || isWrong;

    return matchesSearch && matchesType && matchesWrongOnly;
  });

  // Handle Manual Question Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualErrorMsg("");

    if (!manualId.trim()) {
      setManualErrorMsg("請填寫題目的編號 (例如：E018)");
      return;
    }
    if (questions.some(q => q.id.toLowerCase() === manualId.trim().toLowerCase())) {
      setManualErrorMsg(`題目編號 ${manualId.trim()} 已存在於系統內，請使用不同的編號。`);
      return;
    }
    if (!manualStem.trim()) {
      setManualErrorMsg("請填寫題目主幹內容。");
      return;
    }
    if (!manualAnswer.trim()) {
      setManualErrorMsg("請填寫題目之正確答案。");
      return;
    }

    // Prepare content and options values
    let finalOptions: string[] = [];
    let formattedContent = manualStem.trim();

    if (manualType === QuestionType.YesNo) {
      finalOptions = [];
      const isO = manualAnswer.trim().toUpperCase() === "O" || manualAnswer.trim() === "是";
      setManualAnswer(isO ? "O" : "X");
    } else {
      // Clean empty items
      finalOptions = manualOptions.map(o => o.trim()).filter(Boolean);
      if (finalOptions.length === 0) {
        setManualErrorMsg("單選題與複選題必須至少提供部分候選選項。");
        return;
      }
      // Re-attach parenthesized options to make a valid rawContent line
      const optionsText = finalOptions.map((opt, idx) => `(${idx + 1})${opt}`).join(" ");
      formattedContent = `${manualStem.trim()} ${optionsText}`;
    }

    const newQuestion: Question = {
      id: manualId.trim().toUpperCase(),
      type: manualType,
      rawContent: formattedContent,
      stem: manualStem.trim(),
      options: finalOptions,
      answer: manualAnswer.trim(),
      parsedAnswers: manualType === QuestionType.YesNo 
        ? [manualAnswer.trim().toUpperCase()] 
        : (manualType === QuestionType.Multiple ? manualAnswer.trim().split("") : [manualAnswer.trim()]),
      source: manualSource.trim() || undefined,
      explanation: manualExplanation.trim() || undefined
    };

    onAddQuestions([newQuestion]);

    // Reset Form
    setManualId("");
    setManualStem("");
    setManualAnswer("");
    setManualOptions(["", "", "", ""]);
    setManualSource("");
    setManualExplanation("");
    setIsAddingManual(false);
  };

  const handleOptionChange = (idx: number, value: string) => {
    const updated = [...manualOptions];
    updated[idx] = value;
    setManualOptions(updated);
  };

  const handleBulkImport = () => {
    setBulkErrorMsg("");
    setBulkSuccessMsg("");

    if (!bulkText.trim()) {
      setBulkErrorMsg("未偵測到貼上文字，請將符合格式的題目列表貼入下方欄位。");
      return;
    }

    try {
      const parsed = parseQuestionLines(bulkText);
      if (parsed.length === 0) {
        setBulkErrorMsg("不符合題型格式！請確保每行包含「編號」、「題型」、「答案」與「題目主幹」並由 Tab 或 2個以上空格 隔開。\n\n編例：\nE013    單選題    4    測試單選題？(1)答案A (2)答案B");
        return;
      }

      const existingIds = questions.map(q => q.id.toLowerCase());
      const nonConflictParsed = parsed.filter(q => !existingIds.includes(q.id.toLowerCase()));
      const skippedCount = parsed.length - nonConflictParsed.length;

      if (nonConflictParsed.length === 0) {
        setBulkErrorMsg(`匯入失敗：所有貼上的題目編號 (${parsed.map(q=>q.id).join(", ")}) 均已重複。`);
        return;
      }

      onAddQuestions(nonConflictParsed);
      setBulkSuccessMsg(`已順利匯入 ${nonConflictParsed.length} 題！${skippedCount > 0 ? `(${skippedCount} 題編號重複已略過)` : ""}`);
      setBulkText("");
      setTimeout(() => setIsAddingBulk(false), 3000);
    } catch (err: any) {
      setBulkErrorMsg(`解析時發生錯誤: ${err?.message || err}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="quest-list-container">
      {/* Title block with Editorial Accent */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white border border-editorial-border p-6 sm:p-8 rounded-none" id="quest-list-header">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-editorial-muted">Repository / 庫管理</span>
          <h2 className="text-2xl font-serif font-normal text-editorial-ink flex items-center gap-2">
            主機題卷編制與大量貼上匯入
          </h2>
          <p className="text-xs text-editorial-muted font-serif italic">
            您可以直接由 Excel 試算表或 Word 表格直接複製，一秒貼上或手動建立來擴展您的會考題集。
          </p>
        </div>

        {/* Buttons to open forms - Editorial sharp buttons */}
        <div className="flex flex-wrap gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsAddingBulk(!isAddingBulk);
              setIsAddingManual(false);
              setBulkErrorMsg("");
              setBulkSuccessMsg("");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-white text-editorial-ink hover:bg-editorial-stone border border-editorial-ink px-4 py-3 rounded-none transition cursor-pointer"
            id="btn-import-bulk-panel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-editorial-warm-taupe" />
            貼上試算表匯入
          </button>

          <button
            onClick={() => {
              setIsAddingManual(!isAddingManual);
              setIsAddingBulk(false);
              setManualErrorMsg("");
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-editorial-ink text-white hover:bg-black px-4 py-3 rounded-none transition cursor-pointer"
            id="btn-create-one-panel"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            手動新增一題
          </button>
        </div>
      </div>

      {/* RENDER BULK PASTE BOX */}
      {isAddingBulk && (
        <div className="bg-editorial-stone border border-editorial-ink p-6 sm:p-8 rounded-none space-y-4 animate-slideDown" id="bulk-import-form">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-editorial-ink flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-editorial-ink"></span>
              批次文字題卷剖析匯入 (支援 Tab 與多空格)
            </h3>
            <p className="text-xs text-editorial-muted">
              請從 Excel 或試算表中選取整欄，複製並在下方大文字框中貼上。「是非題」答案用 <b>O</b> 或 <b>X</b> ；「單複選題」答案請相鄰書寫。
            </p>
          </div>

          <div className="bg-white/90 p-4 text-[10px] text-editorial-muted font-mono leading-relaxed border border-editorial-border space-y-1.5 selection:bg-editorial-stone">
            <p className="font-bold text-editorial-ink border-b border-editorial-border pb-1.5">複製範例行貼上來立即練習：</p>
            <p>E001 &nbsp; &nbsp; 是非題 &nbsp; &nbsp; O &nbsp; &nbsp; 測試是非題。</p>
            <p>E013 &nbsp; &nbsp; 單選題 &nbsp; &nbsp; 4 &nbsp; &nbsp; 測試單選題？(1)答案A (2)答案B (3)答案C (4)以上皆是</p>
            <p>E016 &nbsp; &nbsp; 複選題 &nbsp; &nbsp; 12 &nbsp; &nbsp; 測試多選題？(1)答案A (2)答案B (3)答案C (4)以上皆是</p>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="在此黏貼複製自試算表之資料列..."
            rows={6}
            className="w-full bg-white border border-editorial-border focus:border-editorial-ink p-4 rounded-none text-xs font-mono focus:outline-none"
            id="bulk-import-textarea"
          />

          {bulkErrorMsg && (
            <p className="text-xs text-[#AA3333] bg-[#FFF5F5] border border-[#FFCCCC] px-4 py-3 rounded-none whitespace-pre-line flex items-start gap-1.5 font-serif italic">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {bulkErrorMsg}
            </p>
          )}

          {bulkSuccessMsg && (
            <p className="text-xs text-[#2b542b] bg-[#EAF7EA] border border-[#d6eed6] px-4 py-3 rounded-none font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#5CB85C]" />
              {bulkSuccessMsg}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAddingBulk(false)}
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-editorial-ink"
              id="btn-cancel-bulk"
            >
              取消 Cancel
            </button>
            <button
              onClick={handleBulkImport}
              className="px-5 py-2.5 bg-editorial-ink hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-none shadow-sm transition cursor-pointer"
              id="btn-submit-bulk"
            >
              開始剖析匯入 Parse & Import
            </button>
          </div>
        </div>
      )}

      {/* RENDER MANUAL ADD FORM */}
      {isAddingManual && (
        <form onSubmit={handleManualSubmit} className="bg-editorial-stone border border-editorial-ink p-6 sm:p-8 rounded-none space-y-6" id="manual-add-form">
          <h3 className="text-xs font-bold uppercase tracking-wider text-editorial-ink flex items-center gap-2">
            <span className="inline-block w-2 h-1 bg-editorial-ink"></span>
            手動新增個別題目
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted mb-1.5">題目編號 *</label>
              <input
                type="text"
                required
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="例如: E018"
                className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink focus:outline-none"
                id="input-manual-id"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted mb-1.5">學科題型 *</label>
              <select
                value={manualType}
                onChange={(e) => {
                  setManualType(e.target.value as QuestionType);
                  if (e.target.value === QuestionType.YesNo) {
                    setManualAnswer("O");
                  } else {
                    setManualAnswer("1");
                  }
                }}
                className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink focus:outline-none"
                id="select-manual-type"
              >
                <option value={QuestionType.YesNo}>是非題 (O/X)</option>
                <option value={QuestionType.Single}>單選題 (1/2/3/4)</option>
                <option value={QuestionType.Multiple}>複選題 (多碼)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted mb-1.5">答案內容標度 *</label>
              {manualType === QuestionType.YesNo ? (
                <select
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink focus:outline-none"
                  id="select-manual-ans"
                >
                  <option value="O">O 是非題 : 正確</option>
                  <option value="X">X 是非題 : 錯誤</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder={manualType === QuestionType.Multiple ? "如：125 表示選 1, 2, 5 號" : "輸入 1 ~ 4 號代表正確項"}
                  className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink font-mono focus:outline-none"
                  id="input-manual-ans"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted">主要考題幹描述 *</label>
            <textarea
              required
              rows={3}
              value={manualStem}
              placeholder="請輸入詳盡考題文字..."
              onChange={(e) => setManualStem(e.target.value)}
              className="w-full bg-white border border-editorial-border focus:border-editorial-ink p-3 rounded-none text-xs focus:outline-none"
              id="textarea-manual-stem"
            />
          </div>

          {/* Render Options list input for choices */}
          {manualType !== QuestionType.YesNo && (
            <div className="space-y-3 pt-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted">自訂候選選項 (請填入選項內容描述)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="options-inputs-container">
                {manualOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-[10px] font-mono font-bold text-editorial-warm-taupe shrink-0 w-16">
                      (選項 {i + 1})
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`請鍵入選項編號 ${i + 1} 之文字...`}
                      className="flex-1 bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2 rounded-none text-xs focus:outline-none"
                      id={`input-option-${i+1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata: Source and Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted mb-1.5">題目出處</label>
              <input
                type="text"
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                placeholder="例如: 112會考、第二單元"
                className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink focus:outline-none"
                id="input-manual-source"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-editorial-muted mb-1.5">正解解析 / 說明 (Explanation)</label>
              <input
                type="text"
                value={manualExplanation}
                onChange={(e) => setManualExplanation(e.target.value)}
                placeholder="請輸入詳盡解析或解題概念..."
                className="w-full bg-white border border-editorial-border focus:border-editorial-ink px-3 py-2.5 rounded-none text-xs text-editorial-ink focus:outline-none"
                id="input-manual-explanation"
              />
            </div>
          </div>

          {manualErrorMsg && (
            <p className="text-xs text-[#AA3333] bg-[#FFF5F5] border border-[#FFCCCC] px-4 py-3 rounded-none flex items-center gap-2 font-serif italic">
              <AlertCircle className="w-4 h-4" />
              {manualErrorMsg}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingManual(false)}
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-editorial-ink"
              id="btn-cancel-manual"
            >
              取消 Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-editorial-ink hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-none shadow-sm transition cursor-pointer"
              id="btn-submit-manual"
            >
              新增此題 Add Question
            </button>
          </div>
        </form>
      )}

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white border border-editorial-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="search-filter-controls">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-editorial-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋題目描述、編號、或選項內容..."
            className="w-full bg-editorial-stone border border-editorial-border focus:border-editorial-ink pl-10 pr-4 py-2.5 text-xs rounded-none focus:outline-none transition-colors"
            id="filter-search-input"
          />
        </div>

        {/* Quick Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Type */}
          <div className="flex items-center gap-1 bg-editorial-stone border border-editorial-border px-3 py-1.5 rounded-none text-xs" id="filter-type-picker">
            <ListFilter className="w-3.5 h-3.5 text-editorial-muted" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-transparent border-none text-editorial-ink focus:outline-none pr-4 font-bold text-[11px] uppercase tracking-wider"
              id="select-filter-type"
            >
              <option value="ALL">全部題型 Type:All</option>
              <option value={QuestionType.YesNo}>是非題 YesNo</option>
              <option value={QuestionType.Single}>單選題 Single Choice</option>
              <option value={QuestionType.Multiple}>複選題 Multi Choice</option>
            </select>
          </div>

          {/* Filter Erroneous only */}
          <button
            onClick={() => setShowOnlyWrong(!showOnlyWrong)}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-none border transition cursor-pointer ${
              showOnlyWrong 
                ? "bg-[#FFF5F5] border-[#D9534F] text-[#AA3333]" 
                : "bg-white border-editorial-border text-editorial-muted hover:border-editorial-ink hover:text-editorial-ink"
            }`}
            id="toggle-wrong-only-btn"
          >
            {showOnlyWrong ? (
              <XCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-editorial-muted" />
            )}
            僅顯示曾答錯題 Mistakes Only
          </button>
        </div>
      </div>

      {/* QUESTION EXPLAIN GRID DISPLAY */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white border border-editorial-border p-16 text-center text-editorial-muted space-y-3" id="list-empty">
          <HelpCircle className="w-12 h-12 text-editorial-border mx-auto" />
          <p className="font-serif italic text-lg text-editorial-ink">查無相符題庫內容</p>
          <p className="text-[11px] uppercase tracking-wider max-w-sm mx-auto">
            沒有任何題目符合當下的搜尋關鍵詞，請擴增或使用上方按鈕匯入新題目。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="questions-grid-container">
          {filteredQuestions.map((q) => {
            const hasWrongRecord = Object.keys(stats.wrongRecords).includes(q.id);
            const wrongDetail = stats.wrongRecords[q.id];

            return (
              <div 
                key={q.id}
                className={`bg-white border p-6 rounded-none relative transition-colors duration-300 group flex flex-col justify-between ${
                  hasWrongRecord 
                    ? "border-[#D9534F] bg-[#FFF5F5]/20" 
                    : "border-editorial-border hover:border-editorial-ink"
                }`}
                id={`quest-card-item-${q.id}`}
              >
                <div>
                  {/* ID and Tag Row */}
                  <div className="flex items-center justify-between mb-4 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-editorial-ink border border-editorial-ink px-2 py-0.5">
                        {q.id}
                      </span>
                      {q.source && (
                        <span className="text-[9px] bg-editorial-stone border border-editorial-border px-2 py-0.5 text-editorial-muted font-serif italic">
                          出處: {q.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Error Counter Indicator (MANDATORY WRONG RECORD TRACING) */}
                      {hasWrongRecord && (
                        <span className="bg-[#FFF5F5] text-[#AA3333] text-[9px] font-bold px-2 py-0.5 border border-[#FFCCCC] flex items-center gap-1 tracking-wider uppercase font-mono">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Wrong • {wrongDetail.incorrectCount}
                        </span>
                      )}

                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#888]">
                        {q.type}
                      </span>
                    </div>
                  </div>

                  {/* STEM */}
                  <h4 className="text-editorial-ink font-serif text-base leading-snug mb-4 select-none" id={`quest-list-stem-${q.id}`}>
                    {q.stem}
                  </h4>

                  {/* Choices summary */}
                  {q.options.length > 0 && (
                    <div className="space-y-2 mb-6" id="choices-summary">
                      {q.options.map((opt, idx) => {
                        const isCorrectChoice = q.parsedAnswers.includes(`${idx + 1}`);

                        return (
                          <div key={idx} className="text-xs text-editorial-muted flex items-start gap-2 select-none">
                            <span className={`font-mono text-[9px] w-5 h-5 flex items-center justify-center shrink-0 border font-bold ${
                              isCorrectChoice 
                                ? "bg-editorial-ink text-white border-editorial-ink" 
                                : "bg-editorial-stone text-editorial-muted border-editorial-border"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className={isCorrectChoice ? "text-editorial-ink font-bold" : ""}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 mb-4 p-3 bg-editorial-stone border border-editorial-border rounded-none text-[11px] font-serif italic text-editorial-ink select-none leading-relaxed">
                      <span className="font-bold font-sans not-italic block mb-1 text-[9px] uppercase tracking-wider text-editorial-warm-taupe">💡 解析 / 說明 (Explanation)</span>
                      {q.explanation}
                    </div>
                  )}
                </div>

                {/* Correct Answer badge */}
                <div className="pt-4 border-t border-editorial-stone flex justify-between items-center text-xs text-editorial-muted">
                  <span>
                    正確答案: &nbsp;
                    <b className="text-[#2b542b] font-mono bg-[#EAF7EA] border border-[#d6eed6] py-0.5 px-2.5 text-[10px]">
                      {q.type === QuestionType.YesNo 
                        ? (q.parsedAnswers[0] === "O" ? "正確 / O" : "錯誤 / X") 
                        : q.parsedAnswers.join(", ")}
                    </b>
                  </span>

                  {/* Actions column */}
                  <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    {hasWrongRecord && (
                      <button
                        onClick={() => onClearWrongRecord(q.id)}
                        className="p-1 px-2 text-[9px] font-bold uppercase tracking-wider text-editorial-ink hover:bg-editorial-stone border border-editorial-border transition flex items-center gap-1 cursor-pointer"
                        title="自錯題暫存庫中刪除，將此題豁免"
                        id={`btn-clear-wrong-record-${q.id}`}
                      >
                        <RefreshCcw className="w-2.5 h-2.5" />
                        豁免
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`確認要在您的庫中永久刪除這道題目嗎？(ID: ${q.id})`)) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1 text-editorial-muted hover:text-editorial-error border border-transparent hover:border-editorial-border transition rounded-none cursor-pointer"
                      title="刪除此題目"
                      id={`btn-delete-quest-card-${q.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
