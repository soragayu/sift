"use client";

// ==============================================
// 1週間カレンダーコンポーネント
// 指定された時間幅（分単位）でセルを作成するエクセル風テーブル
// ==============================================

import { useState, useEffect, useCallback } from "react";
import { 
  fetchShiftSlots, type ShiftSlot,
  fetchCalendarObjects, type CalendarObject,
  fetchShiftAssignments, type ShiftAssignment,
  insertShiftAssignment, deleteShiftAssignment
} from "@/utils/supabaseFunction";
import Toast, { type ToastType } from "./Toast";

type WeeklyCalendarProps = {
  businessDays: number[];
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  slotDuration: number; // 分単位
  refreshTrigger?: number; // 外部からの再取得トリガー
};

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

// HH:MM → 分に変換
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// 分 → HH:MM に変換
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export default function WeeklyCalendar({
  businessDays,
  startTime,
  endTime,
  slotDuration,
  refreshTrigger,
}: WeeklyCalendarProps) {
  const [slots, setSlots] = useState<ShiftSlot[]>([]);
  const [objects, setObjects] = useState<CalendarObject[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // モーダルの状態管理
  const [selectedCell, setSelectedCell] = useState<{ day: number; start: string; end: string; slotId: string | null } | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [slotsRes, objectsRes, assignsRes] = await Promise.all([
      fetchShiftSlots(),
      fetchCalendarObjects(),
      fetchShiftAssignments()
    ]);
    if (slotsRes.success && slotsRes.data) setSlots(slotsRes.data);
    if (objectsRes.success && objectsRes.data) setObjects(objectsRes.data);
    if (assignsRes.success && assignsRes.data) setAssignments(assignsRes.data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // 時間幅ごとの行データを生成
  const timeRows: { start: string; end: string }[] = [];
  let current = startMin;
  while (current + slotDuration <= endMin) {
    timeRows.push({
      start: minutesToTime(current),
      end: minutesToTime(current + slotDuration),
    });
    current += slotDuration;
  }

  // 今日の曜日（0=月...6=日）
  const today = new Date();
  const jsDay = today.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  // セルクリックハンドラ
  const handleCellClick = (day: number, start: string, end: string) => {
    // 該当するShiftSlotを探す (start_timeは "09:00:00" 形式の可能性があるため prefix で比較)
    const slot = slots.find((s) => s.day_of_week === day && s.start_time.startsWith(start));
    
    setSelectedCell({
      day,
      start,
      end,
      slotId: slot?.id || null,
    });
    setSelectedObjectId(""); // 選択状態をリセット
  };

  // 割り当ての保存
  const handleAssignSubmit = async () => {
    if (!selectedCell || !selectedCell.slotId) {
      setToast({ message: "対象のシフト枠がデータベースに登録されていません。詳細設定から枠を作成してください。", type: "error" });
      return;
    }
    if (!selectedObjectId) {
      setToast({ message: "割り当てる予定オブジェクトを選択してください", type: "error" });
      return;
    }

    setIsSubmitting(true);
    const result = await insertShiftAssignment({
      shift_slot_id: selectedCell.slotId,
      calendar_object_id: selectedObjectId,
    });

    if (result.success) {
      setToast({ message: "予定を割り当てました", type: "success" });
      setSelectedCell(null);
      loadData(); // 再取得
    } else {
      setToast({ message: `割り当てに失敗しました: ${result.error}`, type: "error" });
    }
    setIsSubmitting(false);
  };

  // 割り当ての削除
  const handleDeleteAssignment = async (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation(); // セルのクリックイベントを発火させない
    if (!confirm("この割り当てを削除しますか？")) return;

    setIsLoading(true);
    const result = await deleteShiftAssignment(assignmentId);
    if (result.success) {
      setToast({ message: "割り当てを削除しました", type: "success" });
      loadData();
    } else {
      setToast({ message: `削除に失敗しました: ${result.error}`, type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 text-sm text-gray-500 font-medium backdrop-blur-sm">
            読み込み中...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            {/* ヘッダー（曜日） */}
            <thead>
              <tr>
                <th className="w-32 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left">
                  <span className="text-xs font-medium text-gray-400">
                    時間帯
                  </span>
                </th>
                {businessDays.map((day) => (
                  <th
                    key={day}
                    className="bg-gray-50 border-b border-r border-gray-200 last:border-r-0 px-3 py-3 text-center"
                  >
                    <span
                      className={`
                        text-xs font-semibold uppercase tracking-wider
                        ${day === todayIndex ? "text-blue-600" : "text-gray-500"}
                      `}
                    >
                      {DAY_LABELS[day]}
                    </span>
                    {day === todayIndex && (
                      <div className="mt-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                          {today.getDate()}
                        </span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ボディ */}
            <tbody>
              {timeRows.map((row) => (
                <tr key={row.start}>
                  <td className="border-b border-r border-gray-200 px-3 py-4 bg-gray-50/50 align-middle">
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      {row.start} – {row.end}
                    </span>
                  </td>
                  {businessDays.map((day) => {
                    const slot = slots.find((s) => s.day_of_week === day && s.start_time.startsWith(row.start));
                    const cellAssignments = slot ? assignments.filter(a => a.shift_slot_id === slot.id) : [];

                    return (
                      <td
                        key={`${day}-${row.start}`}
                        onClick={() => handleCellClick(day, row.start, row.end)}
                        className="
                          border-b border-r border-gray-200 last:border-r-0
                          h-24 align-top p-2
                          hover:bg-blue-50/50 transition-colors duration-150
                          cursor-pointer relative
                        "
                      >
                        <div className="flex flex-col gap-1">
                          {cellAssignments.map((assign) => {
                            const obj = objects.find(o => o.id === assign.calendar_object_id);
                            if (!obj) return null;
                            return (
                              <div key={assign.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1.5 rounded-md flex justify-between items-center group/item hover:bg-blue-200 transition-colors shadow-sm">
                                <span className="font-medium truncate mr-1" title={obj.name}>{obj.name}</span>
                                <button
                                  onClick={(e) => handleDeleteAssignment(e, assign.id!)}
                                  className="text-blue-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5"
                                  title="予定を削除"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 予定の割り当てモーダル */}
      {selectedCell && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">予定を割り当てる</h3>
              <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-5 flex flex-col h-[280px]">
              {/* 対象の枠ラベル */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">対象の枠</p>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 font-medium text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {DAY_LABELS[selectedCell.day]}曜日 {selectedCell.start} - {selectedCell.end}
                </div>
                {!selectedCell.slotId && (
                  <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    シフト枠が未作成です。設定画面でカレンダーを作成し直してください。
                  </p>
                )}
              </div>

              {/* オブジェクト選択 */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-2 mt-2">割り当てるオブジェクト</label>
                {objects.length > 0 ? (
                  <select
                    value={selectedObjectId}
                    onChange={(e) => setSelectedObjectId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    disabled={!selectedCell.slotId}
                  >
                    <option value="">オブジェクトを選択してください...</option>
                    {objects.map((obj) => (
                      <option key={obj.id} value={obj.id}>{obj.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    作成済みのオブジェクトがありません。右側のパネルから作成してください。
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={isSubmitting || !selectedCell.slotId || !selectedObjectId}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "追加中..." : "予定を追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
