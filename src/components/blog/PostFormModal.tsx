import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { useCreatePost, useUpdatePost } from "@/hooks/useBlog";
import { cn } from "@/utils/cn";
import type { BlogPost, BlogPostRequest } from "@/types";

interface PostFormModalProps {
  open: boolean;
  onClose: () => void;
  editPost?: BlogPost;
}

const MAX_CONTENT = 5000;
const MAX_TITLE = 200;

export function PostFormModal({ open, onClose, editPost }: PostFormModalProps) {
  const isEdit = Boolean(editPost);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<0 | 1>(0);
  const [imgError, setImgError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPost = useCreatePost();
  const updatePost = useUpdatePost(editPost?.id ?? 0);
  const isPending = createPost.isPending || updatePost.isPending;

  // Reset form when modal opens/closes or editPost changes
  useEffect(() => {
    if (open) {
      setTitle(editPost?.title ?? "");
      setContent(editPost?.content ?? "");
      setImageUrl(editPost?.image_url ?? "");
      setVisibility(editPost?.visibility ?? 0);
      setImgError(false);
      setErrors({});
    }
  }, [open, editPost]);

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Tiêu đề không được để trống.";
    if (title.length > MAX_TITLE) e.title = `Tối đa ${MAX_TITLE} ký tự.`;
    if (!content.trim()) e.content = "Nội dung không được để trống.";
    if (content.length > MAX_CONTENT) e.content = `Tối đa ${MAX_CONTENT} ký tự.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const req: BlogPostRequest = {
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl.trim() || undefined,
      visibility,
    };
    try {
      if (isEdit) {
        await updatePost.mutateAsync(req);
      } else {
        await createPost.mutateAsync(req);
      }
      onClose();
    } catch {
      setErrors({ form: "Có lỗi xảy ra. Vui lòng thử lại." });
    }
  }

  const previewUrl = imageUrl.trim() && !imgError ? imageUrl.trim() : null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      <ModalHeader
        title={isEdit ? "Chỉnh sửa bài viết" : "Viết bài mới"}
        subtitle={isEdit ? "Cập nhật nội dung bài viết của bạn" : "Chia sẻ nội dung với cộng đồng"}
        onClose={onClose}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
        accent="indigo"
      />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="Nhập tiêu đề bài viết..."
              maxLength={MAX_TITLE + 20}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all",
                "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
                errors.title ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.title ? <p className="text-xs text-red-500">{errors.title}</p> : <span />}
              <span className={cn("text-xs", title.length > MAX_TITLE * 0.9 ? "text-amber-500" : "text-gray-400")}>
                {title.length}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nội dung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setErrors((p) => ({ ...p, content: "" })); }}
              placeholder="Chia sẻ suy nghĩ, câu chuyện hoặc kiến thức của bạn..."
              rows={8}
              maxLength={MAX_CONTENT + 100}
              className={cn(
                "w-full resize-y rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all",
                "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
                errors.content ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
              <span className={cn("text-xs", content.length > MAX_CONTENT * 0.9 ? "text-amber-500" : "text-gray-400")}>
                {content.length}/{MAX_CONTENT}
              </span>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ảnh bìa <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImgError(false); }}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {previewUrl && (
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  onError={() => setImgError(true)}
                  className="max-h-40 w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Chế độ hiển thị</label>
            <div className="flex gap-2">
              {([
                { val: 0 as const, label: "🌐 Công khai", desc: "Ai cũng có thể xem" },
                { val: 1 as const, label: "🔒 Riêng tư", desc: "Chỉ mình bạn thấy" },
              ]).map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setVisibility(opt.val)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                    visibility === opt.val
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {opt.label}
                  <span className="text-xs font-normal text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {errors.form && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errors.form}</p>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 2a10 10 0 1 0 10 10" /></svg> Đang lưu...</>
            ) : (
              <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {isEdit ? "Lưu thay đổi" : "Đăng bài"}</>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
