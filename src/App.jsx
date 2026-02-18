// src/App.jsx
// Root component with React Router configuration

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";

// Auth
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Login from "./components/Auth/Login";

// Layout
import Sidebar from "./components/Layout/Sidebar";

// Pages
import Dashboard from "./components/Dashboard/Dashboard";
import Profile from "./components/Profile/Profile";
import Patients from "./components/Patients/Patients";
import Campaigns from "./components/Campaigns/Campaigns";
import Templates from "./components/Templates/Templates";
import Appointments from "./components/Appointments/Appointments";

// Global styles
import "./styles/global.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Ant Design theme customization
const antdTheme = {
  token: {
    colorPrimary: "#4f8ef7",
    borderRadius: 8,
    fontFamily: "'Outfit', sans-serif",
  },
};

const App = () => {
  return (
    <ConfigProvider theme={antdTheme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes wrapped in sidebar layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Sidebar />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="patients" element={<Patients />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="templates" element={<Templates />} />
              <Route path="appointments" element={<Appointments />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;