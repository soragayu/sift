"use client";

// ==============================================
// シフト枠の時間幅選択コンポーネント
// 時間と分を個別に入力可能（最低5分）
// ==============================================

const MIN_DURATION = 5; // 最低時間幅（分）

type SlotDurationSelectorProps = {
  duration: number; // 分単位
  onChange: (duration: number) => void;
};

export default function SlotDurationSelector({
  duration,
  onChange,
}: SlotDurationSelectorProps) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const handleHoursChange = (h: number) => {
    const newDuration = h * 60 + minutes;
    if (newDuration >= MIN_DURATION) onChange(newDuration);
  };

  const handleMinutesChange = (m: number) => {
    const newDuration = hours * 60 + m;
    if (newDuration >= MIN_DURATION) onChange(newDuration);
  };

  // 表示用ラベル
  const label = `${hours}時間${minutes}分`;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        時間幅
      </label>
      <div className="flex items-center gap-2">
        {/* 時間 */}
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={(e) => handleHoursChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="
              w-full px-3 py-2.5 rounded-lg border border-gray-200
              bg-white text-gray-900 text-sm text-center
              focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
              transition-colors duration-200
            "
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            時間
          </span>
        </div>

        <span className="text-gray-400 text-sm">:</span>

        {/* 分 */}
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={59}
            step={5}
            value={minutes}
            onChange={(e) => handleMinutesChange(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            className="
              w-full px-3 py-2.5 rounded-lg border border-gray-200
              bg-white text-gray-900 text-sm text-center
              focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
              transition-colors duration-200
            "
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            分
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        1枠あたり {label}（最低{MIN_DURATION}分）
      </p>
    </div>
  );
}
