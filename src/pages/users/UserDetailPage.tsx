import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUserDetail, useUserHistories } from "@/hooks/useUsers";
import { useUserStore } from "@/store/userStore";
import { isAdmin, isSuperAdmin } from "@/utils/adminBadge";

function StatusBadge({ status }: { status: number }) {
  if (status === 0) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">Hoạt động</span>;
  if (status === 1) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">Vô hiệu hóa</span>;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Không xác định</span>;
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString("vi-VN");
}

export default function UserDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const userId = parseInt(id, 10);
  const [histPage, setHistPage] = useState(0);

  const { data: user, isLoading } = useUserDetail(userId);
  const { data: histories } = useUserHistories(userId, histPage, 10);

  const currentUser = useUserStore((s) => s.user);
  const canManageUsers =
    !!currentUser &&
    (isAdmin(currentUser.username) ||
      isSuperAdmin(currentUser.username) ||
      isAdmin(currentUser.full_name) ||
      isSuperAdmin(currentUser.full_name));

  if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Đang tải...</div>;
  if (!user) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Không tìm thấy người dùng.</div>;

  const totalHistPages = histories ? Math.ceil(histories.amount / 10) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/users" })} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">← Quay lại</button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết người dùng</h1>
        </div>
        {canManageUsers ? (
          <Link
            to="/users/$id/edit"
            params={{ id }}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
          >
            Sửa
          </Link>
        ) : null}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Username</p><p className="font-medium dark:text-gray-100">{user.username}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Họ tên</p><p className="font-medium dark:text-gray-100">{user.full_name}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Email</p><p className="font-medium dark:text-gray-100">{user.email}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Số điện thoại</p><p className="font-medium dark:text-gray-100">{user.phone_number ?? "-"}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</p><StatusBadge status={user.status} /></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">ID</p><p className="font-medium dark:text-gray-100">{user.id}</p></div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 font-semibold text-gray-800 dark:text-gray-200">Lịch sử hoạt động</h2>
        {!histories?.content.length ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có lịch sử.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {histories.content.map((h) => (
              <li key={h.id} className="py-3">
                <p className="text-sm text-gray-800 dark:text-gray-200">{h.message}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{formatTimestamp(h.created_at)} · {h.created_by}</p>
              </li>
            ))}
          </ul>
        )}
        {totalHistPages > 1 && (
          <div className="mt-4 flex gap-2 text-sm text-gray-700 dark:text-gray-300">
            <button onClick={() => setHistPage((p) => Math.max(0, p - 1))} disabled={histPage === 0} className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700">‹</button>
            <span>Trang {histPage + 1}/{totalHistPages}</span>
            <button onClick={() => setHistPage((p) => Math.min(totalHistPages - 1, p + 1))} disabled={histPage >= totalHistPages - 1} className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700">›</button>
          </div>
        )}
      </div>
    </div>
  );
}
