/**
 * Reusable image-upload widget powered by RustFS (POST /api/v1/upload/images).
 *
 * Supports:
 *  - Click to open file picker
 *  - Drag & drop
 *  - Paste from clipboard (Ctrl+V)
 *  - Preview thumbnails with remove button
 *  - Upload progress indicator
 *  - Single-image mode (max=1) — shows larger avatar-style preview
 *  - Multi-image mode  (max>1) — shows grid of thumbnails
 */
import { useCallback, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { uploadService, validateImageFile } from "@/services/uploadService";

interface ImageUploadProps {
  value: string[]; // current URL list
  onChange: (urls: string[]) => void;
  max?: number; // default 10
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  max = 10,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSingle = max === 1;
  const canAdd = value.length < max && !disabled;

  const doUpload = useCallback(
    async (files: File[]) => {
      if (!canAdd || files.length === 0) return;
      setError(null);

      // Validate
      for (const f of files) {
        const err = validateImageFile(f);
        if (err) { setError(err); return; }
      }

      // Limit to remaining slots
      const toUpload = files.slice(0, max - value.length);

      setUploading(true);
      setProgress(0);
      try {
        const results = await uploadService.uploadImages(toUpload, setProgress);
        if (isSingle) {
          onChange([results[0].url]);
        } else {
          onChange([...value, ...results.map((r) => r.url)]);
        }
      } catch {
        setError("Upload thất bại, vui lòng thử lại");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [canAdd, max, value, onChange, isSingle],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    void doUpload(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void doUpload(
      Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")),
    );
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        e.preventDefault();
        void doUpload(files);
      }
    },
    [doUpload],
  );

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  // ── Shared drop-zone props ──────────────────────────────────────────────────
  const dropZoneProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (canAdd) setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: handleDrop,
    onPaste: handlePaste,
  };

  // ── Single-image mode (avatar / logo) ──────────────────────────────────────
  if (isSingle) {
    const url = value[0];
    return (
      <div className={cn("space-y-2", className)}>
        <div
          {...dropZoneProps}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-colors",
            url ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-300 dark:border-gray-600",
            canAdd && "cursor-pointer hover:border-indigo-400",
            isDragging && "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          {url ? (
            <>
              <img src={url} alt="Preview" className="w-full h-full object-cover" />
              {!disabled && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-white font-medium">Đổi ảnh</span>
                </div>
              )}
            </>
          ) : uploading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-[10px] text-gray-400">{progress}%</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-medium">Chọn ảnh</span>
            </div>
          )}
        </div>

        {url && !disabled && (
          <button
            type="button"
            onClick={() => remove(0)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Xóa ảnh
          </button>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />
      </div>
    );
  }

  // ── Multi-image mode ───────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Ảnh ${i + 1}`}
                className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => window.open(url, "_blank")}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa ảnh"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add more button */}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  <span className="text-[9px]">{progress}%</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-medium">Thêm</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Drop zone (shown when no images) */}
      {value.length === 0 && (
        <div
          {...dropZoneProps}
          onClick={() => canAdd && inputRef.current?.click()}
          className={cn(
            "rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 transition-colors select-none",
            isDragging
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
            canAdd
              ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
              : "opacity-50 cursor-not-allowed",
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải lên... {progress}%</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Kéo thả hoặc{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">chọn ảnh</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  JPEG, PNG, GIF, WebP · Tối đa {max} ảnh · 10 MB/ảnh
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Hoặc paste ảnh (Ctrl+V)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled || uploading}
      />
    </div>
  );
}
