-- ==============================================
-- Migration: Add time_unit & overlap conditions to schedule_conditions
-- Description: d(日), w(週), m(月), y(年) ごとの条件指定と
-- overlap関数（同時シフトの制限）を扱えるようにする
-- ==============================================

ALTER TABLE public.schedule_conditions
ADD COLUMN IF NOT EXISTS time_unit TEXT NOT NULL DEFAULT 'd', -- 'd', 'w', 'm', 'y'
ADD COLUMN IF NOT EXISTS condition_type TEXT NOT NULL DEFAULT 'count', -- 'count' または 'overlap'
ADD COLUMN IF NOT EXISTS attribute2_name TEXT,
ADD COLUMN IF NOT EXISTS attribute2_value TEXT;
