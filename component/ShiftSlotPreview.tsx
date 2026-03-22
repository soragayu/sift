"use client";

// ==============================================
// 生成されたシフト枠のプレビュー表示コンポーネント
// 曜日ごとにグループ化してカード形式で表示
// ==============================================

type PreviewSlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type ShiftSlotPreviewProps = {
  slots: PreviewSlot[];
};

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

export default function ShiftSlotPreview({ slots }: ShiftSlotPreviewProps) {
  if (slots.length === 0) return null;

  // 曜日ごとにグループ化
  const grouped = slots.reduce<Record<number, PreviewSlot[]>>((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {});

  // 合計枠数
  const totalSlots = slots.length;

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">プレビュー</h2>
        <span className="text-sm text-gray-500">
          合計 <span className="font-medium text-gray-900">{totalSlots}</span>{" "}
          枠
        </span>
      </div>

      {/* カード一覧 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([dayIndex, daySlots]) => (
            <div
              key={dayIndex}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* 曜日ヘッダー */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    {DAY_LABELS[Number(dayIndex)]}曜日
                  </span>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                    {daySlots.length}枠
                  </span>
                </div>
              </div>

              {/* タイムスロット一覧 */}
              <div className="divide-y divide-gray-50">
                {daySlots.map((slot, i) => (
                  <div
                    key={i}
                    className="px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* タイムインジケーター */}
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-900 shrink-0" />
                    <span className="text-sm text-gray-700 font-mono">
                      {slot.start_time}
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-300 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 font-mono">
                      {slot.end_time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
