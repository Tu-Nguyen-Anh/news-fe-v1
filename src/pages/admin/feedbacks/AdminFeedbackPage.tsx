import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminFeedbacks, useAdminUpdateFeedbackStatus } from "@/hooks/useFeedback";
import type { Feedback } from "@/types";

// ── Shared constants ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  0: { label: "Chờ xử lý",    cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",     dot: "bg-gray-400" },
  1: { label: "Đang xem xét", cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",   dot: "bg-blue-500" },
  2: { label: "Đã xử lý",     cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", dot: "bg-emerald-500" },
  3: { label: "Từ chối",      cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",       dot: "bg-red-500" },
} as const;

function StatusBadge({ status }: { status: 0 | 1 | 2 | 3 }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtDate(epochMs: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(epochMs));
}

// ── Feedback Detail Modal ─────────────────────────────────────────────────────

interface DetailModalProps {
  feedback: Feedback | null;
  onClose: () => void;
}

function FeedbackDetailModal({ feedback, onClose }: DetailModalProps) {
  const updateStatus = useAdminUpdateFeedbackStatus();
  const [updating, setUpdating] = useState(false);

  if (!feedback) return null;

  const handleUpdateStatus = async (status: number) => {
    setUpdating(true);
    try {
      await updateStatus.mutateAsync({ id: feedback.id, status });
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal open onClose={onClose} className="max-w-xl">
      <ModalHeader
        title={feedback.title ?? "Chi tiết góp ý"}
        subtitle={`Từ ${feedback.user_full_name} · ${fmtDate(feedback.created_at)}`}
        onClose={onClose}
        accent="violet"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <ModalBody>
        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
            {feedback.user_avatar ? (
              <img src={feedback.user_avatar} alt={feedback.user_full_name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold">
                {feedback.user_full_name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{feedback.user_full_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">ID #{feedback.user_id}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={feedback.status} /></div>
          </div>

          {/* Content */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed min-h-[100px]">
            {feedback.content}
          </div>

          {/* Images */}
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
                      className="h-24 w-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-violet-400 transition-all"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300 mb-2">
              Cập nhật trạng thái
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1, 2, 3] as const).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = feedback.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isActive || updating}
                    onClick={() => void handleUpdateStatus(s)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                    } disabled:opacity-50`}
                  >
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    {isActive && (
                      <svg className="ml-auto h-3.5 w-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {updating && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-auto">
            <Spinner size="sm" />
            Đang cập nhật...
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Đóng
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ── Feedback Row ──────────────────────────────────────────────────────────────

function FeedbackRow({ item, onView }: { item: Feedback; onView: () => void }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer" onClick={onView}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {item.user_avatar ? (
            <img src={item.user_avatar} alt={item.user_full_name} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {item.user_full_name[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.user_full_name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">ID #{item.user_id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          {item.title && (
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">{item.title}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{item.content}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {(item.images ?? []).length > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {(item.images ?? []).length}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {fmtDate(item.created_at)}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const STATUS_TABS = [
  { value: undefined, label: "Tất cả" },
  { value: 0, label: "Chờ xử lý" },
  { value: 1, label: "Đang xem xét" },
  { value: 2, label: "Đã xử lý" },
  { value: 3, label: "Từ chối" },
] as const;

export default function AdminFeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [detailItem, setDetailItem] = useState<Feedback | null>(null);

  const { data, isPending, isError } = useAdminFeedbacks(statusFilter, page, PAGE_SIZE);
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleTabChange = (val: number | undefined) => {
    setStatusFilter(val);
    setPage(0);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-[1px]">
        <div className="rounded-2xl bg-white px-5 py-4 dark:bg-gray-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý Góp ý</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {data ? `${data.total} góp ý` : "Tổng hợp phản hồi từ người dùng"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-sm overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.value)}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Không thể tải dữ liệu</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Không có góp ý nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Người dùng</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nội dung</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Trạng thái</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ảnh</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ngày gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60">
                {data.items.map((item) => (
                  <FeedbackRow key={item.id} item={item} onView={() => setDetailItem(item)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Trang {page + 1} / {totalPages} · {data?.total ?? 0} góp ý
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedbackDetailModal feedback={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
