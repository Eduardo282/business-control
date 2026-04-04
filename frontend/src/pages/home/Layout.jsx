import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/layout/Sidebar";
import {
  getUnreadQuoteRequestsApi,
  markQuoteNotificationReadApi,
} from "../../actionsAPI/quotes.api";
import { Bell, X } from "@icons";

export default function Layout() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role?.name === "ADMIN" || user?.role?.name === "VENTAS") {
      const fetch = async () => {
        try {
          const res = await getUnreadQuoteRequestsApi();
          setNotifications(res || []);
        } catch (e) {
          console.error("Error fetching notifications", e);
        }
      };
      fetch();
      const interval = setInterval(fetch, 10000); // Polling every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await markQuoteNotificationReadApi(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (id) => {
    // Navigate to CreateQuote with request_id to convert it
    navigate(`/cotizaciones/nueva?request_id=${id}`);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      <Sidebar role={user?.role?.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative bg-gradient-to-br from-slate-50 via-slate-50 to-slate-50">
          {/* Notifications Area */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNavigate(notif.id)}
                  className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors animate-fade-in-down group">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Bell size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">
                        El contacto{" "}
                        <span className="font-bold underline decoration-white/30 underline-offset-2">
                          {notif.contact?.full_name || "Desconocido"}
                        </span>{" "}
                        quiere una cotización.
                      </p>
                      <p className="text-xs text-indigo-200 mt-0.5">
                        Folio #{notif.id} • {notif.client?.business_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(notif.id, e)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Marcar como leída y quitar">
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
