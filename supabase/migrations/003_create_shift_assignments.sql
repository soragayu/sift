-- ==============================================
-- Migration: Create shift_assignments table
-- Description: シフト枠と予定オブジェクトを紐づける中間テーブル
-- ==============================================

CREATE TABLE shift_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_slot_id UUID NOT NULL REFERENCES shift_slots(id) ON DELETE CASCADE,
  calendar_object_id UUID NOT NULL REFERENCES calendar_objects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- パフォーマンス用インデックス
CREATE INDEX idx_shift_assignments_slot ON shift_assignments (shift_slot_id);
CREATE INDEX idx_shift_assignments_object ON shift_assignments (calendar_object_id);

-- RLS（Row Level Security）の有効化
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み書きを許可するポリシー（開発用）
CREATE POLICY "Allow all operations on shift_assignments" ON shift_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);
