import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCreateTopic, useUpdateTopic, useTopicDetail } from "@/hooks/useTopics";
import { useSourcesWithTopics } from "@/hooks/useSources";
import { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import type { TopicRequest } from "@/types";
import type { AxiosError } from "axios";

export interface TopicFormPageProps {
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

const TagIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

export default function TopicFormPage({ mode, recordId, embedded = false, onClose, onSuccess, onEdit }: TopicFormPageProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const routeId = params.id ? parseInt(params.id as string, 10) : 0;
  const id = recordId ?? routeId;

  const { data: existing, isPending: loadPending } = useTopicDetail(id);
  const { data: sources } = useSourcesWithTopics();
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic(id);

  const [form, setForm] = useState<TopicRequest>({ name: "", url: "", rss_url: "", description: "", source_id: 0 });
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === "view";

  useEffect(() => {
    if (existing && (mode === "edit" || mode === "view")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: existing.name, url: existing.url, rss_url: existing.rss_url ?? "", description: existing.description ?? "", source_id: existing.source_id });
    }
  }, [existing, mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (readOnly) return;
    setError(null);
    if (!form.source_id) { setError("Vui lòng chọn nguồn tin."); return; }
    try {
      const payload: TopicRequest = { ...form };
      if (!payload.rss_url) delete payload.rss_url;
      if (!payload.description) delete payload.description;
      if (mode === "create") await createMutation.mutateAsync(payload);
      else await updateMutation.mutateAsync(payload);
      if (embedded) onSuccess?.();
      else navigate({ to: "/topics" });
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message ?? "Có lỗi xảy ra.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const titleMap = { create: "Thêm chủ đề", edit: "Chỉnh sửa chủ đề", view: "Chi tiết chủ đề" };
  const accentMap = { create: "violet" as const, edit: "amber" as const, view: "violet" as const };

  if (embedded) {
    return (
      <>
        <ModalHeader title={titleMap[mode]} subtitle={existing?.name} onClose={onClose ?? (() => {})} icon={<TagIcon />} accent={accentMap[mode]} />
        <ModalBody>
          {readOnly && loadPending ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />)}</div>
          ) : (
            <Fields form={form} setForm={setForm} readOnly={readOnly} sources={sources} error={error} />
          )}
        </ModalBody>
        {!loadPending && (
          <ModalFooter>
            {readOnly ? (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
                <button type="button" onClick={onEdit} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">Chỉnh sửa</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
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
        <button type="button" onClick={() => navigate({ to: "/topics" })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{titleMap[mode]}</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Fields form={form} setForm={setForm} readOnly={readOnly} sources={sources} error={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate({ to: "/topics" })} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
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

function Fields({ form, setForm, readOnly, sources, error }: {
  form: TopicRequest;
  setForm: (f: TopicRequest) => void;
  readOnly: boolean;
  sources?: Array<{ id: number; name: string }>;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Nguồn tin *</label>
        <select disabled={readOnly} value={form.source_id} onChange={(e) => setForm({ ...form, source_id: parseInt(e.target.value) })} className={INPUT}>
          <option value={0}>-- Chọn nguồn tin --</option>
          {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Tên chủ đề *</label>
        <input disabled={readOnly} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required={!readOnly} className={INPUT} placeholder="Thời sự" />
      </div>
      <div>
        <label className={LABEL}>URL chủ đề *</label>
        <input disabled={readOnly} type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required={!readOnly} className={INPUT} placeholder="https://vnexpress.net/thoi-su" />
      </div>
      <div>
        <label className={LABEL}>RSS URL</label>
        <input disabled={readOnly} type="url" value={form.rss_url} onChange={(e) => setForm({ ...form, rss_url: e.target.value })} className={INPUT} placeholder="https://..." />
      </div>
      <div>
        <label className={LABEL}>Mô tả</label>
        <textarea disabled={readOnly} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value }) } className={INPUT + " resize-none"} />
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
