"use client";

// ==============================================
// 1週間カレンダーコンポーネント
// 1時間グリッドで表示し、予定は実際の時間帯に対応して縦軸上に配置
// ==============================================

import { useState, useEffect, useCallback } from "react";
import {
  fetchShiftSlots, type ShiftSlot,
  fetchCalendarObjects, type CalendarObject,
  fetchShiftAssignments, type ShiftAssignment,
  insertShiftAssignment, deleteShiftAssignment,
  findOrCreateShiftSlot
} from "@/utils/supabaseFunction";
import Toast, { type ToastType } from "./Toast";

type WeeklyCalendarProps = {
  businessDays: number[];
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  slotDuration: number; // 分単位（1時間固定 = 60）
  refreshTrigger?: number;
};

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

// HH:MM or HH:MM:SS → 分に変換
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

// 1行の高さ（px）
const ROW_HEIGHT = 64;

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
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  // モーダルの状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<number | "">("");
  const [modalStartTime, setModalStartTime] = useState<string>("");
  const [modalEndTime, setModalEndTime] = useState<string>("");
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
  const totalMinutes = endMin - startMin;

  // 1時間ごとの行ラベルを生成
  const hourRows: { label: string; min: number }[] = [];
  for (let m = startMin; m < endMin; m += slotDuration) {
    hourRows.push({ label: minutesToTime(m), min: m });
  }

  // グリッド全体の高さ
  const gridHeight = hourRows.length * ROW_HEIGHT;

  // 今日の曜日（0=月...6=日）
  const today = new Date();
  const jsDay = today.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  // 「予定を追加」ボタンのクリックハンドラ
  const handleAddButtonClick = () => {
    setModalDay(businessDays.length > 0 ? businessDays[0] : "");
    setModalStartTime(startTime);
    const defaultEnd = Math.min(timeToMinutes(startTime) + 60, endMin);
    setModalEndTime(minutesToTime(defaultEnd));
    setSelectedObjectId("");
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalDay("");
    setModalStartTime("");
    setModalEndTime("");
    setSelectedObjectId("");
  };

  // 時間バリデーション
  const isTimeValid = modalStartTime && modalEndTime && modalStartTime < modalEndTime;

  // 割り当ての保存
  const handleAssignSubmit = async () => {
    if (modalDay === "" || !modalStartTime || !modalEndTime) {
      setToast({ message: "曜日と時間を選択してください", type: "error" });
      return;
    }
    if (!isTimeValid) {
      setToast({ message: "終了時間は開始時間より後に設定してください", type: "error" });
      return;
    }
    if (!selectedObjectId) {
      setToast({ message: "割り当てる予定オブジェクトを選択してください", type: "error" });
      return;
    }

    setIsSubmitting(true);

    const slotResult = await findOrCreateShiftSlot(
      modalDay as number,
      modalStartTime,
      modalEndTime
    );

    if (!slotResult.success || !slotResult.slotId) {
      setToast({
        message: `シフト枠の準備に失敗しました: ${slotResult.error}`,
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    const result = await insertShiftAssignment({
      shift_slot_id: slotResult.slotId,
      calendar_object_id: selectedObjectId,
    });

    if (result.success) {
      setToast({ message: "予定を割り当てました", type: "success" });
      handleCloseModal();
      loadData();
    } else {
      setToast({ message: `割り当てに失敗しました: ${result.error}`, type: "error" });
    }
    setIsSubmitting(false);
  };

  // 割り当ての削除
  const handleDeleteAssignment = async (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation();
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

  // 予定の位置とサイズを計算（px単位）
  const calcPosition = (slot: ShiftSlot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    // グリッド範囲内にクランプ
    const clampedStart = Math.max(slotStart, startMin);
    const clampedEnd = Math.min(slotEnd, endMin);
    const top = ((clampedStart - startMin) / totalMinutes) * gridHeight;
    const height = ((clampedEnd - clampedStart) / totalMinutes) * gridHeight;
    return { top, height: Math.max(height, 20) }; // 最低高さ20px
  };

  // 指定曜日の割り当て一覧を取得し、重なりを考慮したレイアウトサイズを計算する
  const getLayoutForDay = (day: number) => {
    const daySlots = slots.filter(s => s.day_of_week === day);
    const daySlotIds = new Set(daySlots.map(s => s.id));
    
    // 割り当てを取得
    const dayAssignments = assignments
      .filter(a => daySlotIds.has(a.shift_slot_id))
      .map(a => {
        const slot = daySlots.find(s => s.id === a.shift_slot_id)!;
        const obj = objects.find(o => o.id === a.calendar_object_id);
        return { assignment: a, slot, obj };
      })
      .filter(item => item.obj != null) as { assignment: ShiftAssignment; slot: ShiftSlot; obj: CalendarObject }[];

    // 1. 開始時間昇順、終了時間降順でソート
    dayAssignments.sort((a, b) => {
      const startA = timeToMinutes(a.slot.start_time);
      const startB = timeToMinutes(b.slot.start_time);
      if (startA !== startB) return startA - startB;
      const endA = timeToMinutes(a.slot.end_time);
      const endB = timeToMinutes(b.slot.end_time);
      return endB - endA;
    });

    // 2. カラム計算アルゴリズム
    type LayoutEvent = typeof dayAssignments[0] & { top: number; height: number; col: number; groupNumCols: number; left?: string; width?: string };
    const layouts: LayoutEvent[] = [];
    let columns: { end: number }[] = [];
    let currentGroup: LayoutEvent[] = [];
    let groupMaxEnd = -1;

    dayAssignments.forEach(item => {
      const start = timeToMinutes(item.slot.start_time);
      const end = timeToMinutes(item.slot.end_time);

      // グループの終了判定: 現在のイベントがグループの最大終了時間以降に始まる場合
      if (start >= groupMaxEnd && currentGroup.length > 0) {
        currentGroup.forEach(ev => ev.groupNumCols = columns.length);
        currentGroup = [];
        columns = [];
        groupMaxEnd = -1;
      }

      // 割り当てるカラムを探す
      let colIndex = 0;
      while (colIndex < columns.length && columns[colIndex].end > start) {
        colIndex++;
      }

      // 見つかったカラムを更新or新規追加
      if (colIndex < columns.length) {
        columns[colIndex].end = end;
      } else {
        columns.push({ end });
      }

      groupMaxEnd = Math.max(groupMaxEnd, end);
      const pos = calcPosition(item.slot);

      const layoutEvent: LayoutEvent = {
        ...item,
        top: pos.top,
        height: pos.height,
        col: colIndex,
        groupNumCols: 1, // 一時的な値、後で更新される
      };
      
      currentGroup.push(layoutEvent);
      layouts.push(layoutEvent);
    });

    // 最後のグループを処理
    if (currentGroup.length > 0) {
      currentGroup.forEach(ev => ev.groupNumCols = columns.length);
    }

    // 3. left, width のCSSプロパティを計算
    layouts.forEach(ev => {
      const colWidth = 100 / ev.groupNumCols;
      ev.width = `calc(${colWidth}% - 4px)`;
      ev.left = `calc(${ev.col * colWidth}% + 2px)`;
    });

    return layouts;
  };


  // オブジェクトの color 属性に基づくカラースタイルを生成する
  const getEventColorStyle = (obj?: CalendarObject) => {
    const colorAttr = obj?.attributes?.find(attr => attr.name === "color");
    const color = colorAttr?.value;
    if (color) {
      return {
        style: {
          backgroundColor: color,
          borderColor: color,
          color: "#ffffff",
          textShadow: "0px 1px 2px rgba(0,0,0,0.5)"
        },
        className: ""
      };
    }
    return {
      style: {},
      className: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
    };
  };

  // 指定オブジェクトと曜日の割り当て一覧を取得して開始時間順にソートする（テーブル表示用）
  const getAssignmentsForObjectAndDay = (objId: string, day: number) => {
    const daySlots = slots.filter(s => s.day_of_week === day);
    const daySlotIds = new Set(daySlots.map(s => s.id));
    return assignments
      .filter(a => a.calendar_object_id === objId && daySlotIds.has(a.shift_slot_id))
      .map(a => {
        const slot = daySlots.find(s => s.id === a.shift_slot_id)!;
        return { assignment: a, slot };
      })
      .sort((a, b) => timeToMinutes(a.slot.start_time) - timeToMinutes(b.slot.start_time));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        {/* 表示モード切り替えトグル */}
        <div className="inline-flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            タイムライン
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            オブジェクト別
          </button>
        </div>

        {/* 「予定を追加」ボタン */}
        <button
          onClick={handleAddButtonClick}
          className="
            inline-flex items-center gap-2
            px-4 py-2.5 rounded-lg
            bg-gray-900 text-white text-sm font-medium
            hover:bg-gray-800
            transition-colors duration-200
            cursor-pointer shadow-sm
          "
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          予定を追加
        </button>
      </div>

      {viewMode === "timeline" ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 text-sm text-gray-500 font-medium backdrop-blur-sm">
            読み込み中...
          </div>
        )}
        <div className="overflow-x-auto">
          {/* ヘッダー（曜日） */}
          <div
            className="grid border-b border-gray-200 bg-gray-50"
            style={{ gridTemplateColumns: `80px repeat(${businessDays.length}, 1fr)` }}
          >
            {/* 時間ラベルのヘッダー */}
            <div className="px-3 py-3 border-r border-gray-200">
              <span className="text-xs font-medium text-gray-400">時間</span>
            </div>
            {businessDays.map((day) => (
              <div
                key={day}
                className="px-3 py-3 text-center border-r border-gray-200 last:border-r-0"
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
              </div>
            ))}
          </div>

          {/* ボディ：タイムライン */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `80px repeat(${businessDays.length}, 1fr)` }}
          >
            {/* 左列：時間ラベル */}
            <div className="relative border-r border-gray-200 bg-gray-50/50" style={{ height: gridHeight }}>
              {hourRows.map((row, i) => (
                <div
                  key={row.label}
                  className="absolute w-full flex items-start justify-center border-b border-gray-200 last:border-b-0"
                  style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                >
                  <span className="text-[11px] text-gray-500 font-mono mt-1">{row.label}</span>
                </div>
              ))}
            </div>

            {/* 各曜日列 */}
            {businessDays.map((day) => {
              const layouts = getLayoutForDay(day);

              return (
                <div
                  key={day}
                  className="relative border-r border-gray-200 last:border-r-0"
                  style={{ height: gridHeight }}
                >
                  {/* グリッド線（1時間ごと） */}
                  {hourRows.map((row, i) => (
                    <div
                      key={row.label}
                      className="absolute w-full border-b border-gray-100"
                      style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                    />
                  ))}

                  {/* 予定ブロック */}
                  {layouts.map(({ assignment, slot, obj, top, height, left, width }) => {
                    const timeLabel = `${slot.start_time.substring(0, 5)}–${slot.end_time.substring(0, 5)}`;
                    const cStyle = getEventColorStyle(obj);

                    return (
                      <div
                        key={assignment.id}
                        className={`absolute rounded-md px-2 py-1 group/item transition-colors shadow-sm overflow-hidden border z-[1] ${cStyle.className}`}
                        style={{ top, height, left, width, ...cStyle.style }}
                        title={`${obj!.name}\n${timeLabel}`}
                      >
                        <div className="flex justify-between items-start h-full">
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs font-semibold truncate leading-tight">{obj!.name}</p>
                            <p className="text-[10px] text-blue-500 font-mono leading-tight mt-0.5">{timeLabel}</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteAssignment(e, assignment.id!)}
                            className="text-blue-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 flex-shrink-0 ml-1"
                            title="予定を削除"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 text-sm text-gray-500 font-medium backdrop-blur-sm">
              読み込み中...
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 border border-gray-200 bg-gray-50 w-48 sticky left-0 z-10 font-medium text-gray-700 text-sm text-center shadow-[1px_0_0_0_#e5e7eb]">
                    オブジェクト
                  </th>
                  {businessDays.map((day) => (
                    <th key={day} className="px-4 py-3 border border-gray-200 bg-gray-50 text-center">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${day === todayIndex ? "text-blue-600" : "text-gray-500"}`}>
                        {DAY_LABELS[day]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objects.map(obj => (
                  <tr key={obj.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 border border-gray-200 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] align-middle">
                      <div className="font-semibold text-gray-900 text-sm text-center">{obj.name}</div>
                    </td>
                    {businessDays.map(day => {
                      const dayAssignments = getAssignmentsForObjectAndDay(obj.id!, day);

                      return (
                        <td key={day} className="px-3 py-3 border border-gray-200 align-top bg-white">
                          <div className="flex flex-col items-start gap-1.5 min-h-[40px]">
                            {dayAssignments.length > 0 ? (
                              dayAssignments.map(({ assignment, slot }) => {
                                const timeLabel = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
                                const cStyle = getEventColorStyle(obj);
                                return (
                                  <div
                                    key={assignment.id}
                                    className={`group/item flex items-center justify-between border rounded px-2 py-1 text-xs shadow-sm w-max transition-colors ${cStyle.className}`}
                                    style={cStyle.style}
                                  >
                                    <span className="font-mono font-medium">{timeLabel}</span>
                                    <button
                                      onClick={(e) => handleDeleteAssignment(e, assignment.id!)}
                                      className="text-blue-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 ml-1 flex-shrink-0"
                                      title="予定を削除"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="flex items-center justify-start h-full opacity-0">
                                -
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {objects.length === 0 && (
                  <tr>
                    <td colSpan={businessDays.length + 1} className="px-4 py-8 text-center text-sm text-gray-500">
                      作成済みのオブジェクトがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 予定追加モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* モーダルヘッダー */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">予定を追加</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* 曜日選択 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">曜日</label>
                <div className="relative">
                  <select
                    value={modalDay}
                    onChange={(e) => setModalDay(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">曜日を選択...</option>
                    {businessDays.map((day) => (
                      <option key={day} value={day}>
                        {DAY_LABELS[day]}曜日
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 開始時間・終了時間（1分刻み） */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">時間帯</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 mb-1">開始</label>
                    <input
                      type="time"
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      step="60"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    />
                  </div>
                  <span className="text-gray-400 font-medium text-sm mt-4">〜</span>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 mb-1">終了</label>
                    <input
                      type="time"
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      step="60"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {modalStartTime && modalEndTime && !isTimeValid && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    終了時間は開始時間より後に設定してください
                  </p>
                )}

                {modalDay !== "" && isTimeValid && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 font-medium text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {DAY_LABELS[modalDay as number]}曜日 {modalStartTime} - {modalEndTime}
                  </div>
                )}
              </div>

              {/* オブジェクト選択 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">割り当てるオブジェクト</label>
                {objects.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedObjectId}
                      onChange={(e) => setSelectedObjectId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">オブジェクトを選択してください...</option>
                      {objects.map((obj) => (
                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    作成済みのオブジェクトがありません。右側のパネルから作成してください。
                  </p>
                )}
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={isSubmitting || modalDay === "" || !isTimeValid || !selectedObjectId}
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
