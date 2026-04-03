import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { SafeImage } from "@/components/ui/SafeImage";
import { useSourceDetail } from "@/hooks/useSources";

const SOURCE_TYPES = ["Báo điện tử", "Tạp chí", "Blog", "Khác"];

export default function SourceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const sourceId = parseInt(id, 10);
  const { data: source, isLoading } = useSourceDetail(sourceId);

  if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</div>;
  if (!source) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Không tìm thấy nguồn tin.</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/sources" })} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">← Quay lại</button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết nguồn tin</h1>
        </div>
        <Link to="/sources/$id/edit" params={{ id }} className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600">Sửa</Link>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex gap-4 mb-6">
          <SafeImage src={source.avatar} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{source.name}</h2>
            <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{source.url}</a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Loại</p><p className="font-medium dark:text-gray-200">{source.type !== null ? (SOURCE_TYPES[source.type] ?? source.type) : "-"}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">ID</p><p className="font-medium dark:text-gray-200">{source.id}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400">Mô tả</p><p className="font-medium dark:text-gray-200">{source.description ?? "-"}</p></div>
        </div>
      </div>
    </div>
  );
}
