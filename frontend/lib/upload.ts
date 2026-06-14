/** Keep in sync with backend MAX_UPLOAD_FILE_SIZE_MB (default 500). */
export const MAX_UPLOAD_FILE_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_MB || 500
);

export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

export const MAX_UPLOAD_FILES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_FILES || 10);

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
