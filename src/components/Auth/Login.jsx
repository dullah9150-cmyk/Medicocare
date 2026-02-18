// src/components/Auth/Login.jsx
// Firebase email/password login with Ant Design form

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { Form, Input, Button, notification } from "antd";
import { MailOutlined, LockOutlined, HeartOutlined } from "@ant-design/icons";
import "../../styles/Login.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      notification.success({ message: "Welcome back!", placement: "topRight" });
      navigate("/dashboard");
    } catch (err) {
      notification.error({
        message: "Login Failed",
        description: err.message,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <HeartOutlined className="brand-icon" />
          <h1>MedCare</h1>
          <p>Your complete medical management solution</p>
        </div>
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-dot" />
            Manage patients with ease
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            Schedule appointments in seconds
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            Run targeted health campaigns
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to access the dashboard</p>
          </div>

          <Form layout="vertical" onFinish={handleLogin} size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email address" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-btn"
            >
              Sign In
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;