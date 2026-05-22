import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export const supabase = getSupabaseClient();

export const STORAGE_BUCKET = 'clip-files';

export type Clip = {
  id: string;
  room_code: string;
  content: string;
  created_at: string;
};

/** File metadata embedded in clip content with [FILE] prefix */
export type FileMetadata = {
  url: string;
  name: string;
  type: string;
  size: number;
};

/** Parse file metadata from clip content. Returns null if not a file clip. */
export function parseFileClip(content: string): FileMetadata | null {
  if (!content.startsWith('[FILE]')) return null;
  try {
    return JSON.parse(content.slice(6)) as FileMetadata;
  } catch {
    return null;
  }
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
