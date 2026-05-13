import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
