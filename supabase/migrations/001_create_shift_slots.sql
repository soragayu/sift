-- ==============================================
-- shift_slots テーブル定義
-- シフト枠（曜日 × 時間帯）を格納するテーブル
-- ==============================================

CREATE TABLE shift_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0=月, 1=火, 2=水, 3=木, 4=金, 5=土, 6=日
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- パフォーマンス用インデックス
CREATE INDEX idx_shift_slots_day ON shift_slots (day_of_week);

-- RLS（Row Level Security）の有効化
ALTER TABLE shift_slots ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み書きを許可するポリシー（開発用）
-- 本番環境ではユーザー認証に基づくポリシーに変更してください
CREATE POLICY "Allow all operations" ON shift_slots
  FOR ALL
  USING (true)
  WITH CHECK (true);
