import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    const judgeEventId = localStorage.getItem('judgeEventId');
    const redirectTo = judgeEventId ? `/events/${judgeEventId}` : '/login';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
