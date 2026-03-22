"use client";

// ==============================================
// トースト通知コンポーネント
// 成功・エラーメッセージを表示し、自動フェードアウト
// ==============================================

import { useEffect, useState } from "react";

export type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
};

export default function Toast({
  message,
  type,
  onClose,
  duration = 4000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // フェードアウト開始タイマー
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration - 300);

    // 完全に閉じるタイマー
    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        px-4 py-3 rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        ${
          type === "success"
            ? "bg-gray-900 text-white"
            : "bg-red-600 text-white"
        }
      `}
    >
      {/* アイコン */}
      {type === "success" ? (
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}

      {/* メッセージ */}
      <span className="text-sm font-medium">{message}</span>

      {/* 閉じるボタン */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
