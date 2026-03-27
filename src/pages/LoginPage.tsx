import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import type { AxiosError } from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate({ to: "/", replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message ?? "Thông tin đăng nhập không hợp lệ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md sm:p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Đăng nhập</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Tên đăng nhập
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Nhập tên đăng nhập"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" fullWidth isLoading={isLoggingIn}>
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}
