"use client";

// ==============================================
// 予定オブジェクト一覧コンポーネント
// 作成された予定オブジェクトを取得し表示・削除する
// ==============================================

import { useState, useEffect, useCallback } from "react";
import { fetchCalendarObjects, deleteCalendarObject, type CalendarObject } from "@/utils/supabaseFunction";
import Toast, { type ToastType } from "./Toast";

type CalendarObjectListProps = {
  refreshTrigger: number; // 外部からの再取得トリガー
  onEdit: (obj: CalendarObject) => void;
};

export default function CalendarObjectList({ refreshTrigger, onEdit }: CalendarObjectListProps) {
  const [objects, setObjects] = useState<CalendarObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadObjects = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchCalendarObjects();
    if (result.success && result.data) {
      setObjects(result.data);
    } else {
      setToast({ message: "オブジェクトの取得に失敗しました", type: "error" });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadObjects();
  }, [loadObjects, refreshTrigger]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;

    const result = await deleteCalendarObject(id);
    if (result.success) {
      setToast({ message: "削除しました", type: "success" });
      loadObjects();
    } else {
      setToast({ message: `削除に失敗しました: ${result.error}`, type: "error" });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-400 py-4">読み込み中...</div>;
  }

  if (objects.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-6 text-center bg-gray-50/50 rounded-xl border border-gray-100 border-dashed">
        作成されたオブジェクトはありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {objects.map((obj) => (
        <div key={obj.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-sm relative group">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900">{obj.name}</h4>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(obj)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="編集"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(obj.id!, obj.name)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {obj.attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <span className="text-gray-500 w-16 truncate">{attr.name}</span>
                <span className="text-gray-300 mx-1">:</span>
                <span className="text-gray-900 font-medium truncate">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

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
