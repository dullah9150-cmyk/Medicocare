// src/components/Dashboard/Dashboard.jsx
// Real-time summary cards pulling counts from Firestore

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Card, Statistic, Spin } from "antd";
import {
  TeamOutlined,
  NotificationOutlined,
  CalendarOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/dashboard.css";

const StatCard = ({ title, value, icon, color, loading, subtitle }) => (
  <div className="stat-card" style={{ "--accent": color }}>
    <div className="stat-card-inner">
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        {loading ? (
          <Spin size="small" />
        ) : (
          <span className="stat-value">{value}</span>
        )}
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
    </div>
    <div className="stat-bar" style={{ background: color }} />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ patients: 0, campaigns: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subs = [];

    // Real-time listeners for each collection
    const collections = ["patients", "campaigns", "appointments"];
    const newCounts = { patients: 0, campaigns: 0, appointments: 0 };
    let resolved = 0;

    collections.forEach((col) => {
      const unsub = onSnapshot(collection(db, col), (snap) => {
        newCounts[col] = snap.size;
        resolved++;
        setCounts({ ...newCounts });
        if (resolved >= collections.length) setLoading(false);
      });
      subs.push(unsub);
    });

    return () => subs.forEach((u) => u());
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting()},{" "}
            {user?.displayName || user?.email?.split("@")[0]} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening in your practice today.
          </p>
        </div>
        <div className="header-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Patients"
          value={counts.patients}
          icon={<TeamOutlined />}
          color="#4f8ef7"
          loading={loading}
          subtitle="Registered patients"
        />
        <StatCard
          title="Total Campaigns"
          value={counts.campaigns}
          icon={<NotificationOutlined />}
          color="#52c41a"
          loading={loading}
          subtitle="Active campaigns"
        />
        <StatCard
          title="Total Appointments"
          value={counts.appointments}
          icon={<CalendarOutlined />}
          color="#fa8c16"
          loading={loading}
          subtitle="Scheduled visits"
        />
        <StatCard
          title="Activity Score"
          value={counts.patients + counts.campaigns + counts.appointments}
          icon={<RiseOutlined />}
          color="#722ed1"
          loading={loading}
          subtitle="Combined activity"
        />
      </div>

      <div className="dashboard-cards-row">
        <div className="quick-actions-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            {[
              { label: "Add Patient", path: "/patients", color: "#4f8ef7" },
              { label: "New Appointment", path: "/appointments", color: "#fa8c16" },
              { label: "Create Campaign", path: "/campaigns", color: "#52c41a" },
              { label: "New Template", path: "/templates", color: "#722ed1" },
            ].map(({ label, path, color }) => (
              <a key={label} href={path} className="quick-action-btn" style={{ "--btn-color": color }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="overview-card">
          <h3>Overview</h3>
          <div className="overview-list">
            <div className="overview-item">
              <span className="ov-label">Patients</span>
              <div className="ov-bar-wrap">
                <div
                  className="ov-bar"
                  style={{
                    width: `${Math.min((counts.patients / Math.max(counts.patients, 1)) * 100, 100)}%`,
                    background: "#4f8ef7",
                  }}
                />
              </div>
              <span className="ov-count">{counts.patients}</span>
            </div>
            <div className="overview-item">
              <span className="ov-label">Campaigns</span>
              <div className="ov-bar-wrap">
                <div
                  className="ov-bar"
                  style={{
                    width: `${Math.min((counts.campaigns / Math.max(counts.patients || 1, 1)) * 100, 100)}%`,
                    background: "#52c41a",
                  }}
                />
              </div>
              <span className="ov-count">{counts.campaigns}</span>
            </div>
            <div className="overview-item">
              <span className="ov-label">Appointments</span>
              <div className="ov-bar-wrap">
                <div
                  className="ov-bar"
                  style={{
                    width: `${Math.min((counts.appointments / Math.max(counts.patients || 1, 1)) * 100, 100)}%`,
                    background: "#fa8c16",
                  }}
                />
              </div>
              <span className="ov-count">{counts.appointments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;