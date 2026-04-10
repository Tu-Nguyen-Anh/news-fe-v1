import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useMyFeedbacks, useCreateFeedback, useDeleteFeedback } from "@/hooks/useFeedback";
import type { Feedback, FeedbackRequest } from "@/types";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  0: { label: "Chờ xử lý",    cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  1: { label: "Đang xem xét", cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  2: { label: "Đã xử lý",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  3: { label: "Từ chối",      cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300" },
} as const;

function StatusBadge({ status }: { status: 0 | 1 | 2 | 3 }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(epochMs: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(epochMs));
}

// ── Create Feedback Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateFeedbackModal({ open, onClose }: CreateModalProps) {
  const create = useCreateFeedback();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setTitle(""); setContent(""); setImageUrls([]); setError(null); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!content.trim()) { setError("Vui lòng nhập nội dung góp ý"); return; }
    setError(null);
    const req: FeedbackRequest = {
      content: content.trim(),
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
    };
    try {
      await create.mutateAsync(req);
      handleClose();
    } catch {
      setError("Gửi góp ý thất bại, vui lòng thử lại");
    }
  };

  const INPUT =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-800 dark:focus:ring-indigo-900/30";
  const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300";

  const SendIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );

  return (
    <Modal open={open} onClose={handleClose} className="max-w-lg">
      <ModalHeader
        title="Gửi góp ý"
        subtitle="Ý kiến của bạn giúp chúng tôi cải thiện hệ thống"
        onClose={handleClose}
        icon={<SendIcon />}
        accent="indigo"
      />
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Tiêu đề (tuỳ chọn)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className={INPUT}
              placeholder="Ví dụ: Lỗi hiển thị màn hình chat"
            />
          </div>

          <div>
            <label className={LABEL}>Nội dung *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={5}
              className={INPUT + " resize-none"}
              placeholder="Mô tả chi tiết vấn đề hoặc đề xuất của bạn..."
            />
            <p className="mt-1 text-right text-[11px] text-gray-400">{content.length}/5000</p>
          </div>

          <div>
            <label className={LABEL}>Ảnh đính kèm (tối đa 10)</label>
            <ImageUpload
              value={imageUrls}
              onChange={setImageUrls}
              max={10}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={create.isPending || !content.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {create.isPending && <Spinner size="sm" />}
          Gửi góp ý
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  feedback: Feedback | null;
  onClose: () => void;
}

function DetailModal({ feedback, onClose }: DetailModalProps) {
  if (!feedback) return null;

  return (
    <Modal open onClose={onClose} className="max-w-lg">
      <ModalHeader
        title={feedback.title ?? "Chi tiết góp ý"}
        subtitle={fmtDate(feedback.created_at)}
        onClose={onClose}
        accent="indigo"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={feedback.status} />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Cập nhật: {fmtDate(feedback.updated_at)}
            </span>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {feedback.content}
          </div>

          {(feedback.images ?? []).length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300 mb-2">
                Ảnh đính kèm ({(feedback.images ?? []).length})
              </p>
              <div className="flex flex-wrap gap-2">
                {(feedback.images ?? []).map((img) => (
                  <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={img.image_url}
                      alt={img.original_name ?? "Ảnh"}
                      className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-indigo-400 transition-all"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-gray-100 dark:bg-gray-700 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Đóng
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ── Feedback Card ─────────────────────────────────────────────────────────────

interface FeedbackCardProps {
  item: Feedback;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function FeedbackCard({ item, onView, onDelete, deleting }: FeedbackCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <StatusBadge status={item.status} />
          {item.title && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {item.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onView}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            title="Xem chi tiết"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40"
            title="Xóa góp ý"
          >
            {deleting ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
        {item.content}
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        <span>{fmtDate(item.created_at)}</span>
        {(item.images ?? []).length > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {(item.images ?? []).length} ảnh
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function FeedbackPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Feedback | null>(null);
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isPending, isError } = useMyFeedbacks(page, PAGE_SIZE);
  const deleteMutation = useDeleteFeedback();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xóa góp ý này? Ảnh đính kèm cũng sẽ bị xóa.")) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px]">
        <div className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:bg-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Góp ý của tôi</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {data ? `${data.total} góp ý đã gửi` : "Ý kiến của bạn giúp chúng tôi cải thiện"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Gửi góp ý
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center dark:border-red-900/30 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Không thể tải dữ liệu</p>
          <p className="mt-1 text-sm text-red-500 dark:text-red-300">Vui lòng thử lại sau.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Bạn chưa gửi góp ý nào</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Hãy chia sẻ ý kiến để giúp chúng tôi cải thiện!</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Gửi góp ý đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.items.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onView={() => setDetailItem(item)}
                onDelete={() => void handleDelete(item.id)}
                deleting={deletingId === item.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      <CreateFeedbackModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DetailModal feedback={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
