-- ==============================================
-- Migration: Create schedule_conditions table
-- Description: シフト枠への制約条件を管理するテーブル
-- 例: 「role == leader のオブジェクトが1人以上必要」
-- ==============================================

CREATE TABLE IF NOT EXISTS public.schedule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_name TEXT NOT NULL,           -- 対象の属性名 (例: "role")
    attribute_value TEXT NOT NULL,          -- 属性の値 (例: "leader")
    operator TEXT NOT NULL DEFAULT '>=',    -- 比較演算子 (>=, <=, ==, >, <)
    required_count INT NOT NULL DEFAULT 1,  -- 必要数
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.schedule_conditions ENABLE ROW LEVEL SECURITY;

-- パブリックアクセスを許可するポリシー
CREATE POLICY "Enable all actions for schedule_conditions"
ON public.schedule_conditions
FOR ALL
USING (true)
WITH CHECK (true);
