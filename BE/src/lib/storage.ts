import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Supabase client for file storage operations.
 * Uses the service role key for server-side access (bypasses RLS).
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Upload a file to Supabase Storage.
 * Returns the file path in the bucket.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  return data.path;
}

/**
 * Generate a signed URL for downloading a file.
 * The URL expires after the specified duration (default: 5 minutes).
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}
