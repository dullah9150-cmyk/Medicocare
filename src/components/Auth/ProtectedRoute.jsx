// src/components/Auth/ProtectedRoute.jsx
// Redirects unauthenticated users to login page

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Spin } from "antd";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <Spin size="large" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;