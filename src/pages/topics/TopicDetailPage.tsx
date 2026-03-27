import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useTopicDetail } from "@/hooks/useTopics";

export default function TopicDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const topicId = parseInt(id, 10);
  const { data: topic, isLoading } = useTopicDetail(topicId);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!topic) return <div className="p-8 text-center text-gray-500">Không tìm thấy chủ đề.</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/topics" })} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết chủ đề</h1>
        </div>
        <Link to="/topics/$id/edit" params={{ id }} className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600">Sửa</Link>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500">Tên chủ đề</p><p className="font-medium">{topic.name}</p></div>
          <div><p className="text-xs text-gray-500">Nguồn tin</p><p className="font-medium">{topic.source_name}</p></div>
          <div><p className="text-xs text-gray-500">URL</p><a href={topic.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{topic.url}</a></div>
          <div><p className="text-xs text-gray-500">RSS URL</p><p className="font-medium text-sm">{topic.rss_url ?? "-"}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-500">Mô tả</p><p className="font-medium">{topic.description ?? "-"}</p></div>
        </div>
      </div>
    </div>
  );
}
