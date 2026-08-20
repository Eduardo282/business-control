import React, { createContext, useContext, useState, useEffect } from "react";
import { getUnreadQuoteRequestsApi } from "../actionsAPI/quotes.api";
import { useAuth } from "../hooks/useAuth";
import { logger } from "../services/logger";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role?.name === "ADMIN" || user?.role?.name === "VENTAS") {
      const fetchNotifs = async () => {
        try {
          const res = await getUnreadQuoteRequestsApi();
          setNotifications(res || []);
        } catch (e) {
          logger.error("Error fetching notifications", e);
        }
      };
      
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // Fetch every 30 seconds

      const handleFocus = () => {
        if (document.visibilityState === "visible") {
          fetchNotifs();
        }
      };

      window.addEventListener("visibilitychange", handleFocus);
      window.addEventListener("focus", handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("visibilitychange", handleFocus);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
