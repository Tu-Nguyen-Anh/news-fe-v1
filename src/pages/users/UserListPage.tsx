import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import UserFormPage from "@/pages/users/UserFormPage";
import { useDeleteUser, useResetPassword, useUserFilter } from "@/hooks/useUsers";
import { isAdmin, isSuperAdmin } from "@/utils/adminBadge";
import type { User } from "@/types";
import { useUserStore } from "@/store/userStore";

const PAGE_SIZE = 10;

type ModalState = { kind: "none" } | { kind: "create" } | { kind: "view" | "edit"; id: number };

function StatusBadge({ status }: { status: number }) {
  if (status === 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/50">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Hoạt động
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-red-200/50">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />Vô hiệu hóa
    </span>
  );
}

const EyeIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const PencilIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const KeyIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
const UserPlusIcon = () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;

export default function UserListPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const { data, isLoading } = useUserFilter({ page, size: PAGE_SIZE, keyword, status: statusFilter.length ? statusFilter : undefined });
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

  const currentUser = useUserStore((s) => s.user);
  const canManageUsers =
    !!currentUser &&
    (isAdmin(currentUser.username) ||
      isSuperAdmin(currentUser.username) ||
      isAdmin(currentUser.full_name) ||
      isSuperAdmin(currentUser.full_name));

  const deleteMutation = useDeleteUser();
  const resetMutation = useResetPassword();

  const handleDelete = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageUsers) return;
    // Do not allow deleting admin/superadmin accounts.
    if (
      isAdmin(user.username) ||
      isSuperAdmin(user.username) ||
      isAdmin(user.full_name) ||
      isSuperAdmin(user.full_name)
    ) {
      return;
    }
    if (!confirm(`Xóa người dùng "${user.username}"?`)) return;
    await deleteMutation.mutateAsync(user.id);
  };

  const handleResetPassword = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageUsers) return;
    if (!confirm(`Reset mật khẩu cho "${user.username}"?`)) return;
    await resetMutation.mutateAsync(user.id);
    alert("Reset mật khẩu thành công!");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="mt-0.5 text-sm text-gray-400">Quản lý tài khoản hệ thống</p>
        </div>
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setModal({ kind: "create" })}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <UserPlusIcon />
            Thêm người dùng
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 gap-2 sm:max-w-sm">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50"
            />
            {searchInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Xóa tìm kiếm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <select
          onChange={(e) => { const v = e.target.value; setStatusFilter(v === "" ? [] : [parseInt(v)]); setPage(0); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="0">Hoạt động</option>
          <option value="1">Vô hiệu hóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[44rem] w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {["#", "Tài khoản", "Họ tên", "Email", "SĐT", "Trạng thái", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-3.5"><div className="h-5 animate-pulse rounded-lg bg-gray-100" /></td></tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                data?.content.map((user, i) => (
                  <tr
                    key={user.id}
                    className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
                    onClick={() => setModal({ kind: "view", id: user.id })}
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-400">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                          {user.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{user.full_name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{user.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{user.phone_number ?? "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <ActionBtn title="Xem" color="blue" icon={<EyeIcon />} onClick={() => setModal({ kind: "view", id: user.id })} />
                        {(canManageUsers || currentUser?.id === user.id) && <ActionBtn title="Sửa" color="amber" icon={<PencilIcon />} onClick={() => setModal({ kind: "edit", id: user.id })} />}
                        {canManageUsers && (
                          <>
                            <ActionBtn title="Reset MK" color="gray" icon={<KeyIcon />} onClick={(e) => void handleResetPassword(user, e)} />
                            <ActionBtn title="Xóa" color="red" icon={<TrashIcon />} onClick={(e) => void handleDelete(user, e)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <span>Tổng <strong className="text-gray-800">{data?.amount ?? 0}</strong> người dùng</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PageBtn disabled={page === 0} onClick={() => setPage(0)}>«</PageBtn>
            <PageBtn disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</PageBtn>
            <span className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white">{page + 1}</span>
            <span className="px-1 text-gray-400">/ {totalPages}</span>
            <PageBtn disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</PageBtn>
            <PageBtn disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</PageBtn>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal.kind !== "none"} onClose={closeModal} className="max-w-lg">
        {modal.kind === "create" && (
          <UserFormPage mode="create" embedded onClose={closeModal} onSuccess={closeModal} />
        )}
        {(modal.kind === "view" || modal.kind === "edit") && (
          <UserFormPage
            mode={modal.kind}
            recordId={modal.id}
            embedded
            onClose={closeModal}
            onSuccess={closeModal}
            onEdit={() => setModal({ kind: "edit", id: (modal as { id: number }).id })}
          />
        )}
      </Modal>
    </div>
  );
}

function ActionBtn({ title, color, icon, onClick }: { title: string; color: string; icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  const colors: Record<string, string> = {
    blue: "text-indigo-500 hover:bg-indigo-50",
    amber: "text-amber-500 hover:bg-amber-50",
    red: "text-red-500 hover:bg-red-50",
    gray: "text-gray-500 hover:bg-gray-100",
  };
  return (
    <button type="button" title={title} onClick={onClick} className={`rounded-lg p-1.5 transition-colors ${colors[color] ?? colors.gray}`}>
      {icon}
    </button>
  );
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}
