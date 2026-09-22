import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "../../hooks/useAuth";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/layout/Sidebar";
import AmbientGlowBackground from "../../components/layout/AmbientGlowBackground";

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex relative bg-transparent text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-150">
      <AmbientGlowBackground />
      <Sidebar role={user?.role?.name} />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-transparent transition-colors duration-150">
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
