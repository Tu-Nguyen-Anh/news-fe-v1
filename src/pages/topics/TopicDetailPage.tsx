import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useTopicDetail } from "@/hooks/useTopics";

export default function TopicDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const topicId = parseInt(id, 10);
  const { data: topic, isLoading } = useTopicDetail(topicId);

  if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</div>;
  if (!topic) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Không tìm thấy chủ đề.</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/topics" })} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">← Quay lại</button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết chủ đề</h1>
        </div>
        <Link to="/topics/$id/edit" params={{ id }} className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600">Sửa</Link>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Tên chủ đề</p><p className="font-medium dark:text-gray-100">{topic.name}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Nguồn tin</p><p className="font-medium dark:text-gray-100">{topic.source_name}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">URL</p><a href={topic.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">{topic.url}</a></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">RSS URL</p><p className="font-medium text-sm dark:text-gray-100">{topic.rss_url ?? "-"}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400">Mô tả</p><p className="font-medium dark:text-gray-100">{topic.description ?? "-"}</p></div>
        </div>
      </div>
    </div>
  );
}
