import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { useSharePost } from "@/hooks/useBlog";
import type { BlogPost } from "@/types";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

export function ShareModal({ open, onClose, post }: ShareModalProps) {
  const [caption, setCaption] = useState("");
  const sharePost = useSharePost();

  async function handleShare() {
    if (!post) return;
    await sharePost.mutateAsync({ id: post.id, req: caption.trim() ? { content: caption.trim() } : undefined });
    setCaption("");
    onClose();
  }

  if (!post) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title="Chia sẻ bài viết"
        onClose={onClose}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        }
        accent="indigo"
      />
      <ModalBody className="space-y-4">
        {/* Post preview */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">{post.author_name}</p>
          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{post.title}</p>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{post.content}</p>
        </div>
        {/* Caption */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Lời nhắn <span className="text-xs font-normal text-gray-400">(tuỳ chọn)</span>
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Thêm lời nhắn khi chia sẻ..."
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{caption.length}/500</p>
        </div>
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
          type="button"
          onClick={handleShare}
          disabled={sharePost.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {sharePost.isPending ? "Đang chia sẻ..." : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Chia sẻ ngay
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
