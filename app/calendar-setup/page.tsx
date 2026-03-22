"use client";

// ==============================================
// カレンダー（シフト枠）作成ページ
// 曜日・営業時間・時間幅を設定し、保存後ダッシュボードへ遷移
// ==============================================

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DaySelector from "@/component/DaySelector";
import TimeRangeSelector from "@/component/TimeRangeSelector";
import SlotDurationSelector from "@/component/SlotDurationSelector";
import Toast, { type ToastType } from "@/component/Toast";
import { insertShiftSlots, deleteAllShiftSlots } from "@/utils/supabaseFunction";

export default function CalendarSetupPage() {
  const router = useRouter();

  // --- State ---
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");
  const [slotDuration, setSlotDuration] = useState(240); // 分単位（デフォルト4時間）
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

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

  // --- ハンドラー ---

  // 曜日のトグル
  const handleDayToggle = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }, []);

  // トースト表示
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  // カレンダーを作成（生成 → 保存 → ダッシュボードへ遷移）
  const handleCreate = useCallback(async () => {
    // バリデーション
    if (selectedDays.length === 0) {
      showToast("曜日を選択してください", "error");
      return;
    }

    if (startTime >= endTime) {
      showToast("終了時間は開始時間より後に設定してください", "error");
      return;
    }

    setIsCreating(true);

    // シフト枠を生成（分単位）
    const slots: { day_of_week: number; start_time: string; end_time: string }[] = [];
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    for (const day of selectedDays) {
      let current = startMin;
      while (current + slotDuration <= endMin) {
        slots.push({
          day_of_week: day,
          start_time: minutesToTime(current),
          end_time: minutesToTime(current + slotDuration),
        });
        current += slotDuration;
      }
    }

    if (slots.length === 0) {
      showToast("指定した条件ではシフト枠を生成できません。時間幅を調整してください。", "error");
      setIsCreating(false);
      return;
    }

    try {
      // 既存データを削除
      const deleteResult = await deleteAllShiftSlots();
      if (!deleteResult.success) {
        showToast(`既存データの削除に失敗しました: ${deleteResult.error}`, "error");
        setIsCreating(false);
        return;
      }

      // 新しいデータを挿入
      const insertResult = await insertShiftSlots(slots);
      if (!insertResult.success) {
        showToast(`保存に失敗しました: ${insertResult.error}`, "error");
        setIsCreating(false);
        return;
      }

      // ダッシュボードへ遷移（設定情報をURLパラメータで渡す）
      const params = new URLSearchParams({
        days: selectedDays.join(","),
        start: startTime,
        end: endTime,
        duration: slotDuration.toString(),
      });
      router.push(`/dashboard?${params.toString()}`);
    } catch {
      showToast("予期しないエラーが発生しました", "error");
      setIsCreating(false);
    }
  }, [selectedDays, startTime, endTime, slotDuration, showToast, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              Sift
            </h1>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">カレンダー設定</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* ページタイトル */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            シフト枠の作成
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            営業日・営業時間・シフトの時間幅を設定してください。
            <br />
            設定後、ダッシュボードに1週間のカレンダーが表示されます。
          </p>
        </div>

        {/* 設定フォーム */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">基本設定</h3>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* 曜日選択 */}
            <DaySelector
              selectedDays={selectedDays}
              onToggle={handleDayToggle}
            />

            {/* 営業時間 */}
            <TimeRangeSelector
              startTime={startTime}
              endTime={endTime}
              onStartChange={setStartTime}
              onEndChange={setEndTime}
            />

            {/* 時間幅 */}
            <SlotDurationSelector
              duration={slotDuration}
              onChange={setSlotDuration}
            />
          </div>

          {/* アクションバー */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-lg
                bg-gray-900 text-white text-sm font-medium
                hover:bg-gray-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
                cursor-pointer
              "
            >
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  作成中...
                </>
              ) : (
                "カレンダーを作成"
              )}
            </button>
          </div>
        </div>
      </main>

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
