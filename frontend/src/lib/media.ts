/**
 * Resolves a stored media value (full URL or S3 key) to a browser-loadable URL.
 */
export function resolveMediaUrl(
  urlOrKey: string | null | undefined
): string | null {
  if (!urlOrKey?.trim()) return null;

  const value = urlOrKey.trim();
  if (/^https?:\/\//i.test(value)) return value;

  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
  const region = process.env.NEXT_PUBLIC_S3_REGION || "us-east-1";
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${value.replace(/^\//, "")}`;
  }

  return value;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

// shortcut: uploads pass through a Vercel function, which rejects bodies over 4.5 MB; move to presigned S3 uploads to allow larger files.
export const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB, same Vercel body limit as images

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
