import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/layout/Sidebar";

export default function Layout() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-300">
      <Sidebar role={user?.role?.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-gradient-to-br from-zinc-50 via-zinc-50 to-zinc-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
