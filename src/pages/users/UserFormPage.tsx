import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCreateUser, useUpdateUser, useUserDetail } from "@/hooks/useUsers";
import { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import type { UserRequest } from "@/types";
import type { AxiosError } from "axios";
import { isAdmin, isSuperAdmin } from "@/utils/adminBadge";
import { useUserStore } from "@/store/userStore";

export interface UserFormPageProps {
  mode: "create" | "edit" | "view";
  recordId?: number;
  embedded?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onEdit?: () => void;
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 disabled:opacity-100";
const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400";

const ICONS = {
  user: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function UserFormPage({ mode, recordId, embedded = false, onClose, onSuccess, onEdit }: UserFormPageProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const routeId = params.id ? parseInt(params.id as string, 10) : 0;
  const id = recordId ?? routeId;

  const { data: existing, isPending: loadingExisting } = useUserDetail(id);
  const loadPending = mode !== "create" && loadingExisting;
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(id);

  const [form, setForm] = useState<UserRequest>({ username: "", full_name: "", email: "", phone_number: "", status: 0 });
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === "view";

  const currentUser = useUserStore((s) => s.user);
  const canManageUsers =
    !!currentUser &&
    (isAdmin(currentUser.username) ||
      isSuperAdmin(currentUser.username) ||
      isAdmin(currentUser.full_name) ||
      isSuperAdmin(currentUser.full_name));
  const isOwnProfile = !!(currentUser && id && currentUser.id === id);
  const effectiveReadOnly = readOnly || (!canManageUsers && !isOwnProfile);

  const targetUsername = existing?.username ?? form.username;
  const targetFullName = existing?.full_name ?? form.full_name;
  const targetIsPrivileged =
    isAdmin(targetUsername) || isSuperAdmin(targetUsername) || isAdmin(targetFullName) || isSuperAdmin(targetFullName);

  useEffect(() => {
    if (existing && (mode === "edit" || mode === "view")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ username: existing.username, full_name: existing.full_name, email: existing.email, phone_number: existing.phone_number ?? "", status: existing.status });
    }
  }, [existing, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveReadOnly) return;
    setError(null);
    try {
      // Non-admins editing their own profile: restore original status so it can't be changed.
      // Also prevent inactivating admin/superadmin targets.
      const payload: UserRequest =
        (!canManageUsers && existing) || (targetIsPrivileged && existing)
          ? { ...form, status: existing.status }
          : form;
      if (mode === "create") await createMutation.mutateAsync(payload);
      else await updateMutation.mutateAsync(payload);
      if (embedded) onSuccess?.();
      else navigate({ to: "/users" });
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const titleMap = { create: "Thêm người dùng", edit: "Chỉnh sửa người dùng", view: "Chi tiết người dùng" };
  const subtitleMap = { create: "Tạo tài khoản mới", edit: existing?.username ?? "...", view: existing?.username ?? "..." };
  const accentMap = { create: "indigo" as const, edit: "amber" as const, view: "indigo" as const };

  if (embedded) {
    return (
      <>
        <ModalHeader title={titleMap[mode]} subtitle={subtitleMap[mode]} onClose={onClose ?? (() => {})} icon={ICONS.user} accent={accentMap[mode]} />
        <ModalBody>
          {readOnly && loadPending ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />)}
            </div>
          ) : (
            <FormFields
              form={form}
              setForm={setForm}
              readOnly={effectiveReadOnly}
              statusLocked={targetIsPrivileged || !canManageUsers}
              isPending={isPending}
              error={error}
              mode={mode}
            />
          )}
        </ModalBody>
        {!loadPending && (
          <ModalFooter>
            {effectiveReadOnly ? (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
                {readOnly && (canManageUsers || isOwnProfile) && onEdit && (
                  <button type="button" onClick={onEdit} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">Chỉnh sửa</button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="button" disabled={isPending} onClick={handleSubmit} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </>
            )}
          </ModalFooter>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate({ to: "/users" })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{titleMap[mode]}</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <FormFields
          form={form}
          setForm={setForm}
          readOnly={effectiveReadOnly}
          statusLocked={targetIsPrivileged || !canManageUsers}
          isPending={isPending}
          error={error}
          mode={mode}
        />
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => navigate({ to: "/users" })} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
          {!effectiveReadOnly && (
            <button type="button" disabled={isPending} onClick={handleSubmit} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isPending ? "Đang lưu..." : "Lưu"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormFields({ form, setForm, readOnly, statusLocked, isPending: _isPending, error, mode }: {
  form: UserRequest;
  setForm: (f: UserRequest) => void;
  readOnly: boolean;
  statusLocked?: boolean;
  isPending: boolean;
  error: string | null;
  mode: string;
}) {
  const set = (k: keyof UserRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === "status" ? parseInt(e.target.value) : e.target.value });

  const lock = statusLocked ?? false;

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Tên đăng nhập *</label>
        <input disabled={mode === "edit" || readOnly} value={form.username} onChange={set("username")} required={!readOnly} className={INPUT} placeholder="username" />
      </div>
      <div>
        <label className={LABEL}>Họ và tên *</label>
        <input disabled={readOnly} value={form.full_name} onChange={set("full_name")} required={!readOnly} className={INPUT} placeholder="Nguyễn Văn A" />
      </div>
      <div>
        <label className={LABEL}>Email *</label>
        <input disabled={readOnly} type="email" value={form.email} onChange={set("email")} required={!readOnly} className={INPUT} placeholder="email@example.com" />
      </div>
      <div>
        <label className={LABEL}>Số điện thoại</label>
        <input disabled={readOnly} value={form.phone_number ?? ""} onChange={set("phone_number")} className={INPUT} placeholder="0901234567" />
      </div>
      <div>
        <label className={LABEL}>Trạng thái</label>
        <select
          disabled={readOnly || lock}
          value={form.status}
          onChange={set("status")}
          className={INPUT}
        >
          <option value={0}>Hoạt động</option>
          <option value={1}>Vô hiệu hóa</option>
        </select>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          {error}
        </div>
      )}
    </div>
  );
}
