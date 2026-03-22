-- ==============================================
-- Migration: Create calendar_objects table
-- Description: カレンダー予定オブジェクトを格納するテーブルを作成
-- ==============================================

CREATE TABLE IF NOT EXISTS public.calendar_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    attributes JSONB NOT NULL DEFAULT '[]'::jsonb, -- 属性と値のペアの配列を想定 [{ "name": string, "value": string }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- タイムゾーンをJSTに設定（表示用）
COMMENT ON COLUMN public.calendar_objects.created_at IS '作成日時（JST）';

-- RLS (Row Level Security) の設定
ALTER TABLE public.calendar_objects ENABLE ROW LEVEL SECURITY;

-- 今回はパブリックアクセスを許可するポリシー（認証なしで全操作可）
-- ※運用要件に応じて認証ユーザーのみなどに変更する
CREATE POLICY "Enable all actions for public" 
ON public.calendar_objects 
FOR ALL 
USING (true)
WITH CHECK (true);
