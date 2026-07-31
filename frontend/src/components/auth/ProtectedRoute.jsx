import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center gap-3 bg-surface-app px-6 text-sm font-medium text-content-secondary dark:text-zinc-200"
      >
        <span className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2277B4] dark:border-zinc-700 dark:border-t-blue-400 motion-reduce:animate-none" />
        <span>Cargando…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
