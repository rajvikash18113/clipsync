-- =============================================
-- ClipSync: Supabase Database Setup Script
-- Run in: Supabase > SQL Editor
-- =============================================

-- 1. Create the clips table
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.clips (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code  TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_room_code  ON public.clips (room_code);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON public.clips (created_at);

-- 2. Enable Row Level Security
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON public.clips FOR SELECT USING (true);

CREATE POLICY "Public insert access"
  ON public.clips FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete access"
  ON public.clips FOR DELETE USING (true);

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;

-- 4. (Optional) TTL cleanup - delete clips older than 24h every hour
-- Requires pg_cron extension enabled in Dashboard > Database > Extensions first
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-old-clips', '0 * * * *',
--   $$DELETE FROM public.clips WHERE created_at < NOW() - INTERVAL '24 hours';$$);
