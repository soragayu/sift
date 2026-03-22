"use client";

// ==============================================
// 曜日選択トグルボタンコンポーネント
// 月〜日の7つのトグルボタンを表示
// ==============================================

type DaySelectorProps = {
  selectedDays: number[];
  onToggle: (day: number) => void;
};

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"] as const;

export default function DaySelector({
  selectedDays,
  onToggle,
}: DaySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        曜日を選択
      </label>
      <div className="flex gap-2">
        {DAY_LABELS.map((label, index) => {
          const isSelected = selectedDays.includes(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => onToggle(index)}
              className={`
                w-11 h-11 rounded-lg text-sm font-medium
                transition-all duration-200 ease-in-out
                border cursor-pointer
                ${
                  isSelected
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
      {selectedDays.length === 0 && (
        <p className="text-xs text-gray-400">
          少なくとも1つの曜日を選択してください
        </p>
      )}
    </div>
  );
}
