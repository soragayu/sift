"use client";

// ==============================================
// 予定オブジェクト作成コンポーネント
// オブジェクトの名称と、動的な属性・値のペアを入力する
// ==============================================

import { useState, useEffect } from "react";
import { insertCalendarObject, updateCalendarObject, type CalendarObjectAttr, type CalendarObject } from "@/utils/supabaseFunction";
import Toast, { type ToastType } from "./Toast";

type CalendarObjectCreatorProps = {
  onCreated: () => void; // 作成完了時のコールバック（一覧の再取得など）
  editingObject: CalendarObject | null;
  onCancelEdit: () => void;
};

export default function CalendarObjectCreator({ onCreated, editingObject, onCancelEdit }: CalendarObjectCreatorProps) {
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState<CalendarObjectAttr[]>([{ name: "", value: "" }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 編集モード時の初期値セット
  useEffect(() => {
    if (editingObject) {
      setName(editingObject.name);
      setAttributes(editingObject.attributes && editingObject.attributes.length > 0 ? editingObject.attributes : [{ name: "", value: "" }]);
    } else {
      setName("");
      setAttributes([{ name: "", value: "" }]);
    }
  }, [editingObject]);

  // 属性を追加
  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: "", value: "" }]);
  };

  // 属性を削除
  const handleRemoveAttribute = (index: number) => {
    if (attributes.length <= 1) return; // 最低1つは残す
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // 属性の入力を更新（英数字・ハイフン・アンダースコア・スペースのみ許可）
  const handleAttributeChange = (index: number, field: "name" | "value", newValue: string) => {
    // 半角英数字と一部の記号（-_スペース）以外を取り除く
    const filteredValue = newValue.replace(/[^a-zA-Z0-9_\-\s]/g, "");
    
    const newAttributes = [...attributes];
    newAttributes[index][field] = filteredValue;
    setAttributes(newAttributes);
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setToast({ message: "オブジェクト名を入力してください", type: "error" });
      return;
    }

    // 空の属性・値をチェック
    const hasEmptyAttribute = attributes.some((attr) => !attr.name.trim() || !attr.value.trim());
    if (hasEmptyAttribute) {
      setToast({ message: "すべての属性名と値を入力してください", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        attributes: attributes.map((attr) => ({ name: attr.name.trim(), value: attr.value.trim() })),
      };

      let result;
      if (editingObject && editingObject.id) {
        result = await updateCalendarObject(editingObject.id, payload);
      } else {
        result = await insertCalendarObject(payload);
      }

      if (result.success) {
        setToast({ message: editingObject ? "予定オブジェクトを更新しました" : "予定オブジェクトを作成しました", type: "success" });
        // フォームをリセット (親側で editingObject が null になると useEffect でもリセットされる)
        setName("");
        setAttributes([{ name: "", value: "" }]);
        onCreated();
      } else {
        setToast({ message: `${editingObject ? "更新" : "作成"}に失敗しました: ${result.error}`, type: "error" });
      }
    } catch {
      setToast({ message: "予期しないエラーが発生しました", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">
          {editingObject ? "予定オブジェクトの編集" : "予定オブジェクトの作成"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-6">
        {/* オブジェクト名 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">オブジェクト名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: レジ担当, 掃除"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors duration-200"
          />
        </div>

        {/* 属性リスト */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              属性と値 <span className="text-gray-400 font-normal ml-1">※半角英数字のみ</span>
            </label>
            <span className="text-xs text-gray-400">最低1つ必須</span>
          </div>
          
          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={attr.name}
                    onChange={(e) => handleAttributeChange(index, "name", e.target.value)}
                    placeholder="属性 (例: 役割)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                    placeholder="値 (例: マネージャー)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(index)}
                  disabled={attributes.length <= 1}
                  className="mt-1 p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors duration-200 rounded-lg"
                  title="削除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddAttribute}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            属性を追加
          </button>
        </div>



        {/* 保存ボタン */}
        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          {editingObject && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
          >
            {isSubmitting ? "保存中..." : editingObject ? "変更を保存" : "オブジェクトを作成"}
          </button>
        </div>
      </form>

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
