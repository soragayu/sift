"use client";

// ==============================================
// ダッシュボードページ
// 1週間カレンダーと概要を表示、削除ボタン付き
// ==============================================

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useCallback } from "react";
import WeeklyCalendar from "@/component/WeeklyCalendar";
import Toast, { type ToastType } from "@/component/Toast";
import CalendarObjectCreator from "@/component/CalendarObjectCreator";
import CalendarObjectList from "@/component/CalendarObjectList";
import { deleteAllShiftSlots, type CalendarObject } from "@/utils/supabaseFunction";

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  
  // オブジェクト一覧のリフレッシュ用トリガー
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // 編集対象のオブジェクト状態
  const [editingObject, setEditingObject] = useState<CalendarObject | null>(null);

  const handleObjectCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setEditingObject(null); // 作成・更新後に編集状態を解除
  }, []);

  // URLパラメータからデータを読み取る
  const businessDays = useMemo(() => {
    const days = searchParams.get("days");
    return days ? days.split(",").map(Number) : [];
  }, [searchParams]);

  const startTime = searchParams.get("start") || "09:00";
  const endTime = searchParams.get("end") || "22:00";
  const slotDuration = 60; // 1時間固定

  // 時間幅の表示ラベル
  const durationLabel = "1時間";

  // 枠数計算（分ベース）
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const slotsPerDay = Math.floor(
    (timeToMinutes(endTime) - timeToMinutes(startTime)) / slotDuration
  );

  // 今日の日付情報
  const today = new Date();
  const dateStr = today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // カレンダー削除ハンドラー
  const handleDelete = async () => {
    if (!confirm("このカレンダーを削除しますか？\n設定ページに戻ります。")) return;

    setIsDeleting(true);
    try {
      const result = await deleteAllShiftSlots();
      if (result.success) {
        router.push("/calendar-setup");
      } else {
        setToast({ message: `削除に失敗しました: ${result.error}`, type: "error" });
        setIsDeleting(false);
      }
    } catch {
      setToast({ message: "予期しないエラーが発生しました", type: "error" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              Sift
            </h1>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">ダッシュボード</span>
          </div>
          <div className="flex items-center gap-4">
            {/* 削除ボタン */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                inline-flex items-center gap-1.5 text-sm text-gray-400
                hover:text-red-600 transition-colors duration-200
                cursor-pointer disabled:opacity-50
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isDeleting ? "削除中..." : "削除"}
            </button>
            {/* 設定変更ボタン */}
            <button
              onClick={() => router.push("/calendar-setup")}
              className="
                inline-flex items-center gap-1.5 text-sm text-gray-500
                hover:text-gray-900 transition-colors duration-200
                cursor-pointer
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              設定を変更
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* タイトル */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              週間シフトカレンダー
            </h2>
            <p className="mt-1 text-sm text-gray-500">{dateStr}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左側：カレンダー（3カラム分） */}
          <div className="lg:col-span-3 space-y-8">
            {/* 概要カード */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs text-gray-500 font-medium mb-1">営業日</p>
                <p className="text-lg font-semibold text-gray-900">
                  {businessDays.map((d) => DAY_LABELS[d]).join("・")}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs text-gray-500 font-medium mb-1">営業時間</p>
                <p className="text-lg font-semibold text-gray-900">
                  {startTime} 〜 {endTime}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  シフト枠数 / 日
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {slotsPerDay}枠
                  <span className="text-sm text-gray-400 font-normal ml-2">
                    ({durationLabel}ごと)
                  </span>
                </p>
              </div>
            </div>

            {/* 週間カレンダー */}
            <WeeklyCalendar
              businessDays={businessDays}
              startTime={startTime}
              endTime={endTime}
              slotDuration={slotDuration}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 右側：オブジェクト作成・一覧（1カラム分） */}
          <div className="lg:col-span-1 space-y-6">
            <CalendarObjectCreator 
              onCreated={handleObjectCreated} 
              editingObject={editingObject}
              onCancelEdit={() => setEditingObject(null)}
            />
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">
                作成済みのオブジェクト
              </h3>
              <CalendarObjectList 
                refreshTrigger={refreshTrigger} 
                onEdit={(obj) => setEditingObject(obj)}
              />
            </div>
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

// useSearchParams を使うため Suspense で囲む
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-sm text-gray-400">読み込み中...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
