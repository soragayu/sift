-- ==============================================
-- Migration: Add conditions column to calendar_objects
-- Description: カレンダーオブジェクトに条件フィルタ機能を追加
-- ==============================================

ALTER TABLE public.calendar_objects
ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 条件の形式:
-- [{ "attribute": string, "operator": string, "value": string, "logic": "AND"|"OR" }]

COMMENT ON COLUMN public.calendar_objects.conditions IS '条件フィルタの配列（JSONB）';
