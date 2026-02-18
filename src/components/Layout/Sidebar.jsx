// src/components/Layout/Sidebar.jsx
// Main app layout with sidebar navigation using React Bootstrap + Ant Design icons

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { notification, Avatar, Tooltip } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  NotificationOutlined,
  FileTextOutlined,
  CalendarOutlined,
  LogoutOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/Layout.css";

const navItems = [
  { path: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { path: "/profile", icon: <UserOutlined />, label: "Profile" },
  { path: "/patients", icon: <TeamOutlined />, label: "Patients" },
  { path: "/campaigns", icon: <NotificationOutlined />, label: "Campaigns" },
  { path: "/templates", icon: <FileTextOutlined />, label: "Templates" },
  { path: "/appointments", icon: <CalendarOutlined />, label: "Appointments" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    notification.info({ message: "Logged out successfully", placement: "topRight" });
    navigate("/login");
  };

  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <HeartOutlined className="sidebar-logo-icon" />
          {!collapsed && <span className="sidebar-brand">Medical Care</span>}
        </div>

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon, label }) => (
            <Tooltip
              key={path}
              title={collapsed ? label : ""}
              placement="right"
            >
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">{icon}</span>
                {!collapsed && <span className="nav-label">{label}</span>}
              </NavLink>
            </Tooltip>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <Avatar
              icon={<UserOutlined />}
              className="user-avatar"
              size={collapsed ? 32 : 36}
            />
            {!collapsed && (
              <div className="user-meta">
                <span className="user-name">
                  {user?.displayName || user?.email?.split("@")[0]}
                </span>
                <span className="user-role">Administrator</span>
              </div>
            )}
          </div>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right">
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutOutlined />
              {!collapsed && <span>Logout</span>}
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Sidebar;