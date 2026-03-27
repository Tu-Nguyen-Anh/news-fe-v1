import { Link } from "@tanstack/react-router";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-lg text-gray-600">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Go home
      </Link>
    </main>
  );
}
