import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCreateArticle, useUpdateArticle, useArticleDetail } from "@/hooks/useArticles";
import { useTopicFilter } from "@/hooks/useTopics";
import { ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import type { ArticleRequest } from "@/types";
import type { AxiosError } from "axios";
import { useUserStore } from "@/store/userStore";
import { isAdmin } from "@/utils/adminBadge";

export interface ArticleFormPageProps {
  mode: "create" | "edit";
  recordId?: number;
  embedded?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50";
const LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400";

const NewsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h10M7 13h6" />
  </svg>
);

export default function ArticleFormPage({ mode, recordId, embedded = false, onClose, onSuccess }: ArticleFormPageProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const routeId = params.id ? parseInt(params.id as string, 10) : 0;
  const id = recordId ?? routeId;

  const currentUser = useUserStore((s) => s.user);
  const canManageArticles =
    !!currentUser && (isAdmin(currentUser.username) || isAdmin(currentUser.full_name));

  const { data: existing } = useArticleDetail(id);
  const { data: topicsPage } = useTopicFilter({ page: 0, size: 200 });
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(id);

  const [form, setForm] = useState<ArticleRequest>({ title: "", link: "", guid: "", description: "", pub_date: undefined, image_link: "", topic_id: 0 });
  const [pubDateStr, setPubDateStr] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing && mode === "edit") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ title: existing.title, link: existing.link, guid: existing.guid ?? "", description: existing.description ?? "", pub_date: existing.pub_date ?? undefined, image_link: existing.image_link ?? "", topic_id: existing.topic_id });
      if (existing.pub_date) setPubDateStr(new Date(existing.pub_date).toISOString().slice(0, 16));
    }
  }, [existing, mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!form.topic_id) { setError("Vui lòng chọn chủ đề."); return; }
    try {
      const payload: ArticleRequest = { ...form, pub_date: pubDateStr ? new Date(pubDateStr).getTime() : undefined };
      if (!payload.guid) delete payload.guid;
      if (!payload.description) delete payload.description;
      if (!payload.image_link) delete payload.image_link;
      if (!payload.pub_date) delete payload.pub_date;
      if (mode === "create") await createMutation.mutateAsync(payload);
      else await updateMutation.mutateAsync(payload);
      if (embedded) onSuccess?.();
      else navigate({ to: "/articles" });
    } catch (err) {
      setError((err as AxiosError<{ message: string }>).response?.data?.message ?? "Có lỗi xảy ra.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const title = mode === "create" ? "Thêm bài viết" : "Chỉnh sửa bài viết";

  if (!canManageArticles) {
    return (
      <div className={embedded ? "space-y-4 p-2" : "mx-auto max-w-lg p-6"}>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="text-base font-bold text-gray-900">Không đủ quyền</div>
          <div className="mt-1 text-sm text-gray-500">Chỉ admin mới có thể {mode === "create" ? "thêm" : "sửa"} bài viết.</div>
          <div className="mt-5 flex items-center justify-center gap-3">
            {embedded ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: "/articles" })}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <>
        <ModalHeader title={title} subtitle={mode === "edit" ? (existing?.title ?? "...") : "Tạo bài viết mới"} onClose={onClose ?? (() => {})} icon={<NewsIcon />} accent="rose" />
        <ModalBody className="space-y-4">
          <FormFields form={form} setForm={setForm} pubDateStr={pubDateStr} setPubDateStr={setPubDateStr} topics={topicsPage?.content} error={error} />
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
          <button type="button" disabled={isPending} onClick={() => void handleSubmit()} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </ModalFooter>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate({ to: "/articles" })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormFields form={form} setForm={setForm} pubDateStr={pubDateStr} setPubDateStr={setPubDateStr} topics={topicsPage?.content} error={error} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate({ to: "/articles" })} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isPending ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormFields({ form, setForm, pubDateStr, setPubDateStr, topics, error }: {
  form: ArticleRequest;
  setForm: (f: ArticleRequest) => void;
  pubDateStr: string;
  setPubDateStr: (s: string) => void;
  topics?: Array<{ id: number; name: string; source_name: string }>;
  error: string | null;
}) {
  return (
    <>
      <div>
        <label className={LABEL}>Chủ đề *</label>
        <select required value={form.topic_id} onChange={(e) => setForm({ ...form, topic_id: parseInt(e.target.value) })} className={INPUT}>
          <option value={0}>-- Chọn chủ đề --</option>
          {topics?.map((t) => <option key={t.id} value={t.id}>{t.source_name} — {t.name}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Tiêu đề *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} placeholder="Tiêu đề bài viết" />
      </div>
      <div>
        <label className={LABEL}>URL bài viết *</label>
        <input required type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={INPUT} placeholder="https://..." />
      </div>
      <div>
        <label className={LABEL}>URL ảnh đại diện</label>
        <input type="url" value={form.image_link ?? ""} onChange={(e) => setForm({ ...form, image_link: e.target.value })} className={INPUT} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>GUID</label>
          <input value={form.guid ?? ""} onChange={(e) => setForm({ ...form, guid: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Ngày xuất bản</label>
          <input type="datetime-local" value={pubDateStr} onChange={(e) => setPubDateStr(e.target.value)} className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Mô tả / Tóm tắt</label>
        <textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={INPUT + " resize-none"} />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          {error}
        </div>
      )}
    </>
  );
}
