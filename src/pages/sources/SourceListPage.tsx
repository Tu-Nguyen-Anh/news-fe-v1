import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import SourceFormPage from "@/pages/sources/SourceFormPage";
import { useSourceFilter, useDeleteSource } from "@/hooks/useSources";
import type { Source } from "@/types";

const SOURCE_TYPE_LABELS = ["Báo điện tử", "Tạp chí", "Blog", "Khác"];
const PAGE_SIZE = 10;
type ModalState = { kind: "none" } | { kind: "create" } | { kind: "view" | "edit"; id: number };

const EyeIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const PencilIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PlusIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const LinkIcon = () => <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

const TYPE_COLORS: Record<number, string> = {
  0: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  1: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  2: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  3: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function SourceListPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const { data, isLoading } = useSourceFilter({ page, size: PAGE_SIZE, keyword });
  const deleteMutation = useDeleteSource();
  const totalPages = data ? Math.ceil(data.amount / PAGE_SIZE) : 0;
  const closeModal = () => setModal({ kind: "none" });

  const KEYWORD_DEBOUNCE_MS = 400;
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput.trim());
      setPage(0);
    }, KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa nguồn tin "${source.name}"?`)) return;
    await deleteMutation.mutateAsync(source.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nguồn tin</h1>
          <p className="mt-0.5 text-sm text-gray-400">Quản lý các nguồn RSS đang theo dõi</p>
        </div>
        <button type="button" onClick={() => setModal({ kind: "create" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">
          <PlusIcon />Thêm nguồn tin
        </button>
      </div>

      <div className="flex gap-2 sm:max-w-sm">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Tìm nguồn tin..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
          />
          {searchInput.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Xóa tìm kiếm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-[48rem] w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800">
                {["#", "Nguồn tin", "URL", "Loại", "Mô tả", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {isLoading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-5 py-3.5"><div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" /></td></tr>)
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                data?.content.map((source, i) => (
                  <tr key={source.id} className="group cursor-pointer transition-colors hover:bg-emerald-50/30" onClick={() => setModal({ kind: "view", id: source.id })}>
                    <td className="px-5 py-3.5 text-sm text-gray-400 dark:text-gray-500">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                          <SafeImage src={source.avatar} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{source.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5">
                      <a href={source.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:underline">
                        <LinkIcon /><span className="max-w-[160px] truncate">{source.url}</span>
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      {source.type !== null ? (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_COLORS[source.type] ?? TYPE_COLORS[3]}`}>
                          {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="max-w-[180px] px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="line-clamp-1">{source.description ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <ActionBtn title="Xem" color="blue" icon={<EyeIcon />} onClick={() => setModal({ kind: "view", id: source.id })} />
                        <ActionBtn title="Sửa" color="amber" icon={<PencilIcon />} onClick={() => setModal({ kind: "edit", id: source.id })} />
                        <ActionBtn title="Xóa" color="red" icon={<TrashIcon />} onClick={(e) => void handleDelete(source, e)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Tổng <strong className="text-gray-800 dark:text-gray-200">{data?.amount ?? 0}</strong> nguồn tin</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PageBtn disabled={page === 0} onClick={() => setPage(0)}>«</PageBtn>
            <PageBtn disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</PageBtn>
            <span className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white">{page + 1}</span>
            <span className="px-1 text-gray-400">/ {totalPages}</span>
            <PageBtn disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</PageBtn>
            <PageBtn disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</PageBtn>
          </div>
        )}
      </div>

      <Modal open={modal.kind !== "none"} onClose={closeModal} className="max-w-lg">
        {modal.kind === "create" && <SourceFormPage mode="create" embedded onClose={closeModal} onSuccess={closeModal} />}
        {(modal.kind === "view" || modal.kind === "edit") && (
          <SourceFormPage mode={modal.kind} recordId={modal.id} embedded onClose={closeModal} onSuccess={closeModal}
            onEdit={() => setModal({ kind: "edit", id: (modal as { id: number }).id })} />
        )}
      </Modal>
    </div>
  );
}

function ActionBtn({ title, color, icon, onClick }: { title: string; color: string; icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  const colors: Record<string, string> = { blue: "text-indigo-500 hover:bg-indigo-50", amber: "text-amber-500 hover:bg-amber-50", red: "text-red-500 hover:bg-red-50" };
  return <button type="button" title={title} onClick={onClick} className={`rounded-lg p-1.5 transition-colors ${colors[color]}`}>{icon}</button>;
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">{children}</button>;
}
