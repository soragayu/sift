"use client";

// ==============================================
// スケジュール条件パネル
// シフト枠への制約条件を管理する
// 例: 「role == leader のオブジェクトが1人以上必要」
// ==============================================

import { useState, useEffect, useCallback } from "react";
import {
  fetchScheduleConditions,
  insertScheduleCondition,
  deleteScheduleCondition,
  type ScheduleCondition,
} from "@/utils/supabaseFunction";
import Toast, { type ToastType } from "./Toast";

// 利用可能な演算子
const OPERATORS = [
  { value: ">=", label: "≧", desc: "以上" },
  { value: "<=", label: "≦", desc: "以下" },
  { value: "==", label: "＝", desc: "ちょうど" },
  { value: ">", label: "＞", desc: "より多い" },
  { value: "<", label: "＜", desc: "より少ない" },
] as const;

export default function ScheduleConditionPanel() {
  const [conditions, setConditions] = useState<ScheduleCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 入力フォーム状態
  const [isAdding, setIsAdding] = useState(false);
  const [formText, setFormText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 条件一覧を取得
  const loadConditions = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchScheduleConditions();
    if (result.success && result.data) {
      setConditions(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConditions();
  }, [loadConditions]);

  // 条件を追加
  const handleSubmit = async () => {
    if (!formText.trim()) {
      setToast({ message: "条件を入力してください", type: "error" });
      return;
    }

    // パース処理: [dwmy] need count(overlap(attr1 = val1, attr2 = val2)) >= N
    // または: [dwmy] need count(attr = value) >= N
    const overlapMatch = formText.trim().match(/^([dwmy])\s+need\s+count\s*\(\s*overlap\s*\(\s*([a-zA-Z0-9_\-\s]+?)\s*=\s*([a-zA-Z0-9_\-\s]+?)\s*,\s*([a-zA-Z0-9_\-\s]+?)\s*=\s*([a-zA-Z0-9_\-\s]+?)\s*\)\s*\)\s*(>=|<=|==|>|<)\s*(\d+)$/i);
    const countMatch = formText.trim().match(/^([dwmy])\s+need\s+count\s*\(\s*([a-zA-Z0-9_\-\s]+?)\s*=\s*([a-zA-Z0-9_\-\s]+?)\s*\)\s*(>=|<=|==|>|<)\s*(\d+)$/i);
    
    let insertData: any = null;

    if (overlapMatch) {
      const [, unit, attrName1, attrValue1, attrName2, attrValue2, operator, countStr] = overlapMatch;
      const count = parseInt(countStr, 10);
      if (count < 0) {
        setToast({ message: "必要数は0以上で入力してください", type: "error" });
        return;
      }
      insertData = {
        time_unit: unit.toLowerCase(),
        condition_type: "overlap",
        attribute_name: attrName1.trim(),
        attribute_value: attrValue1.trim(),
        attribute2_name: attrName2.trim(),
        attribute2_value: attrValue2.trim(),
        operator,
        required_count: count,
      };
    } else if (countMatch) {
      const [, unit, attrName, attrValue, operator, countStr] = countMatch;
      const count = parseInt(countStr, 10);
      if (count < 0) {
        setToast({ message: "必要数は0以上で入力してください", type: "error" });
        return;
      }
      insertData = {
        time_unit: unit.toLowerCase(),
        condition_type: "count",
        attribute_name: attrName.trim(),
        attribute_value: attrValue.trim(),
        operator,
        required_count: count,
      };
    } else {
      setToast({ message: "フォーマットが正しくありません。\n例1: d need count(role = student) >= 1\n例2: w need count(overlap(role = leader, role = trainee)) == 0", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const result = await insertScheduleCondition(insertData);

    if (result.success) {
      setToast({ message: "条件を追加しました", type: "success" });
      setFormText("");
      setIsAdding(false);
      loadConditions();
    } else {
      setToast({ message: `追加に失敗しました: ${result.error}`, type: "error" });
    }
    setIsSubmitting(false);
  };

  // 条件を削除
  const handleDelete = async (id: string) => {
    const result = await deleteScheduleCondition(id);
    if (result.success) {
      setToast({ message: "条件を削除しました", type: "success" });
      loadConditions();
    } else {
      setToast({ message: `削除に失敗しました: ${result.error}`, type: "error" });
    }
  };

  // 演算子のラベルを取得
  const getOperatorLabel = (op: string) => {
    return OPERATORS.find((o) => o.value === op)?.desc || op;
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* ヘッダー */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">スケジュール条件</h3>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              条件を追加
            </button>
          )}
        </div>

        {/* 追加フォーム */}
        {isAdding && (
          <div className="px-5 py-4 border-b border-gray-100 bg-violet-50/30">
            <div className="rounded-lg border border-gray-200 bg-gray-950 p-3">
              {/* コードエディター風ヘッダー */}
              <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-800">
                <div className="w-2 h-2 rounded-full bg-red-500/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-gray-500 ml-2 font-mono">new condition</span>
              </div>

              {/* 条件定義エリア: 1行テキスト入力 */}
              <div className="flex items-center gap-1.5 text-sm font-mono">
                <input
                  type="text"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="例: d need count(overlap(role = leader, role = trainee)) == 0"
                  className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-gray-700 focus:border-blue-500 rounded text-emerald-300 placeholder:text-gray-700 focus:outline-none transition-colors text-xs font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setFormText("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formText.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isSubmitting ? "追加中..." : "追加"}
              </button>
            </div>
          </div>
        )}

        {/* 条件一覧 */}
        <div className="px-5 py-3">
          {isLoading ? (
            <div className="text-xs text-gray-400 py-2">読み込み中...</div>
          ) : conditions.length === 0 ? (
            <div className="text-xs text-gray-400 py-3 text-center">
              条件が設定されていません
            </div>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="flex items-center justify-between group rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center min-w-0">
                    {/* 条件ラベル */}
                    <div className="flex items-center text-xs font-mono bg-gray-900 text-gray-200 px-3 py-1.5 rounded-md flex-shrink-0 shadow-sm border border-gray-800">
                      <span className="text-pink-400 font-bold text-sm mr-2">{cond.time_unit || 'd'}</span>
                      <span className="text-purple-400 font-bold text-[10px] uppercase tracking-wider">need</span>
                      <span className="text-blue-400 font-bold ml-1.5">count</span>
                      <span className="text-gray-400 font-bold mx-1">(</span>
                      {cond.condition_type === "overlap" && (
                        <>
                          <span className="text-sky-400 font-bold">overlap</span>
                          <span className="text-gray-400 font-bold mx-1">(</span>
                        </>
                      )}
                      
                      {cond.condition_type === "overlap" ? (
                        <>
                          <span className="text-green-300 font-bold">{cond.attribute_name}</span>
                          <span className="text-gray-400 mx-1">=</span>
                          <span className="text-orange-300 font-bold">{cond.attribute_value}</span>
                          <span className="text-gray-400 mx-1">,</span>
                          <span className="text-green-300 font-bold">{cond.attribute2_name}</span>
                          <span className="text-gray-400 mx-1">=</span>
                          <span className="text-orange-300 font-bold">{cond.attribute2_value}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-green-300 font-bold">{cond.attribute_name}</span>
                          <span className="text-gray-400 mx-1">=</span>
                          <span className="text-orange-300 font-bold">{cond.attribute_value}</span>
                        </>
                      )}
                      {cond.condition_type === "overlap" && <span className="text-gray-400 font-bold mx-1">)</span>}
                      <span className="text-gray-400 font-bold mx-1">)</span>
                      <span className="text-purple-400 font-bold ml-1.5">{cond.operator}</span>
                      <span className="text-orange-400 font-bold ml-1">{cond.required_count}</span>
                    </div>
                  </div>
                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDelete(cond.id!)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"
                    title="条件を削除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* トースト通知 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
