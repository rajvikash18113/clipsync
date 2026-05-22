-- =============================================
-- ClipSync: Supabase Database Setup Script
-- Run in: Supabase > SQL Editor
-- =============================================

-- ⚠️ IMPORTANT: Data is NEVER deleted from this database.
-- Deletion is handled on the frontend only (via localStorage).
-- This ensures data persistence and recoverability.

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

-- ⚠️ DELETE policy is intentionally REMOVED.
-- Data should never be deleted from the database.
-- Clips are only hidden on the frontend via localStorage.
-- If you previously had a delete policy, drop it:
-- DROP POLICY IF EXISTS "Public delete access" ON public.clips;

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;

-- 4. TTL cleanup is intentionally DISABLED.
-- Data must persist forever in the database.
-- The 24-hour vanish is handled on the frontend for the PUBLIC room only.
-- DO NOT enable pg_cron to delete old clips:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-old-clips', '0 * * * *',
--   $$DELETE FROM public.clips WHERE created_at < NOW() - INTERVAL '24 hours';$$);

-- =============================================
-- 5. Create the Storage Bucket & Storage Policies
-- (Required for the File Sharing feature)
-- =============================================

-- Create the bucket for file clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('clip-files', 'clip-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they already exist to avoid errors
DROP POLICY IF EXISTS "Public Select Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;

-- Allow public read access to download files
CREATE POLICY "Public Select Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clip-files');

-- Allow public insert access to upload files
CREATE POLICY "Public Insert Access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clip-files');
