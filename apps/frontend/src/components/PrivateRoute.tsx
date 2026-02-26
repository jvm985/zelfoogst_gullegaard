import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  roles?: ('USER' | 'ADMIN')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or an unauthorized page
  }

  return <Outlet />;
};

export default PrivateRoute;
