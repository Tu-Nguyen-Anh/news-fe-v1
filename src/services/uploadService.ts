import type { UploadResult } from "@/types";
import { apiClient } from "./apiClient";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP";
  if (file.size > MAX_SIZE_BYTES) return "Ảnh không được vượt quá 10 MB";
  return null;
}

export const uploadService = {
  /** Upload 1–10 images to RustFS via the backend proxy. Returns list of URLs. */
  uploadImages: async (
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<UploadResult[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const { data } = await apiClient.post<{ data: UploadResult[] }>(
      "/upload/images",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onProgress
          ? (e) => {
              const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
              onProgress(pct);
            }
          : undefined,
      },
    );
    return data.data;
  },
};
