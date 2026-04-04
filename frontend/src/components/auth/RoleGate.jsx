import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function RoleGate({ allow = [] }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role.name)) return <Navigate to="/" replace />;
  return <Outlet />;
}
