// src/components/Profile/Profile.jsx
// Fetch and update user profile in Firestore "users" collection

import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { Form, Input, Button, notification, Avatar, Skeleton } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, SaveOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/profile.css";

const Profile = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch existing user profile from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          form.setFieldsValue(snap.data());
        } else {
          // Pre-fill from Firebase auth data
          form.setFieldsValue({
            name: user.displayName || "",
            email: user.email,
            phone: "",
          });
        }
      } catch (err) {
        notification.error({ message: "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      // Save to Firestore users collection
      await setDoc(doc(db, "users", user.uid), {
        ...values,
        email: user.email,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
      });
      // Update Firebase Auth display name
      await updateProfile(auth.currentUser, { displayName: values.name });
      notification.success({ message: "Profile updated successfully!" });
    } catch (err) {
      notification.error({ message: "Failed to save profile", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="profile-avatar-card">
          <Avatar size={96} icon={<UserOutlined />} className="profile-avatar" />
          <h3>{user?.displayName || user?.email?.split("@")[0]}</h3>
          <span className="profile-role-badge">Administrator</span>
          <p className="profile-email">{user?.email}</p>
        </div>

        {/* Form card */}
        <div className="profile-form-card">
          <h3>Edit Information</h3>
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              size="large"
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Your full name" />
              </Form.Item>

              <Form.Item label="Email Address" name="email">
                <Input
                  prefix={<MailOutlined />}
                  disabled
                  placeholder="Email (read-only)"
                />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  {
                    pattern: /^[0-9+\-\s()]{7,15}$/,
                    message: "Enter a valid phone number",
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+1 234 567 8900" />
              </Form.Item>

              <Form.Item label="Specialty / Role" name="specialty">
                <Input placeholder="e.g. General Practitioner" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
                className="save-btn"
              >
                Save Changes
              </Button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;