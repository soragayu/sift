"use client";

// ==============================================
// 営業時間（開始〜終了）選択コンポーネント
// 30分刻みで選択可能
// ==============================================

type TimeRangeSelectorProps = {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
};

// 00:00 〜 23:30 の30分刻みオプションを生成
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour}:${min}`;
});

export default function TimeRangeSelector({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: TimeRangeSelectorProps) {
  const selectStyle = `
    w-full px-3 py-2.5 rounded-lg border border-gray-200
    bg-white text-gray-900 text-sm
    focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
    transition-colors duration-200
    appearance-none cursor-pointer
  `;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        営業時間
      </label>
      <div className="flex items-center gap-3">
        {/* 開始時間 */}
        <div className="flex-1">
          <div className="relative">
            <select
              value={startTime}
              onChange={(e) => onStartChange(e.target.value)}
              className={selectStyle}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <span className="text-gray-400 font-medium text-sm">〜</span>

        {/* 終了時間 */}
        <div className="flex-1">
          <div className="relative">
            <select
              value={endTime}
              onChange={(e) => onEndChange(e.target.value)}
              className={selectStyle}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={`end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {startTime >= endTime && (
        <p className="text-xs text-red-500">
          終了時間は開始時間より後に設定してください
        </p>
      )}
    </div>
  );
}
