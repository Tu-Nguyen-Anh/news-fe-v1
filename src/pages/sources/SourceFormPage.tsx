import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCreateSource, useUpdateSource, useSourceDetail } from "@/hooks/useSources";
import { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { SourceRequest } from "@/types";
import type { AxiosError } from "axios";

const SOURCE_TYPES = [
  { value: 0, label: "Báo điện tử" },
  { value: 1, label: "Tạp chí" },
  { value: 2, label: "Blog" },
  { value: 3, label: "Khác" },
];

export interface SourceFormPageProps {
  mode: "create" | "edit" | "view";
  recordId?: number;
  embedded?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onEdit?: () => void;
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 disabled:opacity-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-800 dark:focus:ring-indigo-900/30 dark:disabled:bg-gray-800 dark:disabled:text-gray-500";
const LABEL =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300";

const DocIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 2v6h6" />
  </svg>
);

export default function SourceFormPage({ mode, recordId, embedded = false, onClose, onSuccess, onEdit }: SourceFormPageProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const routeId = params.id ? parseInt(params.id as string, 10) : 0;
  const id = recordId ?? routeId;

  const { data: existing, isPending: loadPending } = useSourceDetail(id);
  const createMutation = useCreateSource();
  const updateMutation = useUpdateSource(id);

  const [form, setForm] = useState<SourceRequest>({ name: "", url: "", avatar: "", type: 0, description: "" });
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === "view";

  useEffect(() => {
    if (existing && (mode === "edit" || mode === "view")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: existing.name, url: existing.url, avatar: existing.avatar ?? "", type: existing.type ?? 0, description: existing.description ?? "" });
    }
  }, [existing, mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (readOnly) return;
    setError(null);
    try {
      const payload: SourceRequest = { ...form };
      if (!payload.avatar) delete payload.avatar;
      if (!payload.description) delete payload.description;
      if (mode === "create") await createMutation.mutateAsync(payload);
      else await updateMutation.mutateAsync(payload);
      if (embedded) onSuccess?.();
      else navigate({ to: "/sources" });
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message ?? "Có lỗi xảy ra.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const titleMap = { create: "Thêm nguồn tin", edit: "Chỉnh sửa nguồn tin", view: "Chi tiết nguồn tin" };
  const accentMap = { create: "emerald" as const, edit: "amber" as const, view: "emerald" as const };

  if (embedded) {
    return (
      <>
        <ModalHeader title={titleMap[mode]} subtitle={existing?.name} onClose={onClose ?? (() => {})} icon={<DocIcon />} accent={accentMap[mode]} />
        <ModalBody>
          {readOnly && loadPending ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />)}</div>
          ) : (
            <Fields form={form} setForm={setForm} readOnly={readOnly} error={error} />
          )}
        </ModalBody>
        {!loadPending && (
          <ModalFooter>
            {readOnly ? (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">Đóng</button>
                <button type="button" onClick={onEdit} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">Chỉnh sửa</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">Hủy</button>
                <button type="button" disabled={isPending} onClick={() => void handleSubmit()} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
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
        <button type="button" onClick={() => navigate({ to: "/sources" })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{titleMap[mode]}</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Fields form={form} setForm={setForm} readOnly={readOnly} error={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate({ to: "/sources" })} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700">Hủy</button>
            {!readOnly && (
              <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {isPending ? "Đang lưu..." : "Lưu"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Fields({ form, setForm, readOnly, error }: {
  form: SourceRequest;
  setForm: (f: SourceRequest) => void;
  readOnly: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Tên nguồn *</label>
        <input disabled={readOnly} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required={!readOnly} className={INPUT} placeholder="VnExpress" />
      </div>
      <div>
        <label className={LABEL}>URL website *</label>
        <input disabled={readOnly} type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required={!readOnly} className={INPUT} placeholder="https://vnexpress.net" />
      </div>
      <div>
        <label className={LABEL}>Logo</label>
        {readOnly ? (
          form.avatar ? (
            <img src={form.avatar} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Chưa có logo</span>
          )
        ) : (
          <ImageUpload
            max={1}
            value={form.avatar ? [form.avatar] : []}
            onChange={(urls) => setForm({ ...form, avatar: urls[0] ?? "" })}
            disabled={readOnly}
          />
        )}
      </div>
      <div>
        <label className={LABEL}>Loại nguồn</label>
        <div className="relative">
          <select
            disabled={readOnly}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: parseInt(e.target.value) })}
            className={INPUT + " appearance-none pr-10"}
          >
            {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div>
        <label className={LABEL}>Mô tả</label>
        <textarea disabled={readOnly} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={INPUT + " resize-none"} placeholder="Mô tả về nguồn tin..." />
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
