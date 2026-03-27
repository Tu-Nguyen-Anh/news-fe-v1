import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { SafeImage } from "@/components/ui/SafeImage";

function StatusBadge({ status }: { status: number }) {
  if (status === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-200/60">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Hoạt động
      </span>
    );
  }

  if (status === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200/60">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Vô hiệu hóa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200/60">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
      Không xác định
    </span>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isFetchingUser } = useAuth();

  const initials = useMemo(() => {
    const name = user?.full_name?.trim() ?? user?.username?.trim() ?? "";
    if (!name) return "U";
    return name[0]?.toUpperCase() ?? "U";
  }, [user?.full_name, user?.username]);

  if (isFetchingUser && !user) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <div>
              <div className="text-sm font-semibold text-gray-900">Đang tải hồ sơ...</div>
              <div className="text-xs text-gray-500">Chuẩn bị dữ liệu người dùng</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
          <div className="text-sm font-semibold text-red-700">Không tìm thấy hồ sơ</div>
          <div className="mt-1 text-sm text-red-600/90">Vui lòng đăng nhập lại hoặc thử lại.</div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 p-[1px]">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
            <p className="mt-1 text-sm text-gray-500">Thông tin tài khoản đang đăng nhập</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white shadow-sm">
                {user.avatar ? (
                  <SafeImage src={user.avatar} alt={user.full_name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{initials}</span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-gray-900">{user.full_name}</h2>
                <StatusBadge status={user.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Số điện thoại</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{user.phone_number ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">User ID</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{user.id}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Trạng thái</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {user.status === 0 ? "Hoạt động" : user.status === 1 ? "Vô hiệu hóa" : "Không xác định"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

