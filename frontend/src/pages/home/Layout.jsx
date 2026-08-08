import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "../../hooks/useAuth";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/layout/Sidebar";

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-150">
      <Sidebar role={user?.role?.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-gradient-to-br from-zinc-50 via-zinc-50 to-zinc-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-150">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center p-8">
              <span className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-[#2277B4] dark:border-zinc-700 dark:border-t-blue-400 motion-reduce:animate-none" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
