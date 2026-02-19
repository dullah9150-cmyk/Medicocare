// src/components/Templates/Templates.jsx
// CRUD for message templates stored in Firestore "templates" collection

import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  notification,
  Popconfirm,
  Space,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/module.css";

const { TextArea } = Input;

const Templates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  // Refs for keyboard navigation
  const titleInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const messageTextAreaRef = useRef(null);
  const submitButtonRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "templates"), (snap) => {
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
    
    // Focus on first field after modal opens
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 100);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    form.setFieldsValue(tmpl);
    setModalOpen(true);
    
    // Focus on first field after modal opens
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 100);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "templates", editing.id), {
          ...values,
          updatedAt: new Date().toISOString(),
        });
        notification.success({ message: "Template updated!" });
      } else {
        await addDoc(collection(db, "templates"), {
          ...values,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        notification.success({ message: "Template created!" });
      }
      setModalOpen(false);
    } catch (err) {
      notification.error({ message: "Error saving template", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "templates", id));
      notification.success({ message: "Template deleted" });
    } catch (err) {
      notification.error({ message: "Delete failed" });
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        if (nextRef.current.focus) {
          nextRef.current.focus();
        } else if (nextRef.current.querySelector('input, textarea')) {
          nextRef.current.querySelector('input, textarea').focus();
        }
      }
    }
  };

  const filtered = templates.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a, b) => a.title?.localeCompare(b.title),
      render: (t) => (
        <span>
          <FileTextOutlined style={{ marginRight: 6, color: "#722ed1" }} />
          <strong>{t}</strong>
        </span>
      ),
    },
    { title: "Subject", dataIndex: "subject" },
    {
      title: "Message Preview",
      dataIndex: "message",
      ellipsis: true,
      render: (msg) => <span className="text-muted">{msg?.slice(0, 60)}...</span>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => d ? new Date(d).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            className="action-btn edit"
          />
          <Popconfirm
            title="Delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger className="action-btn delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">{templates.length} message templates</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          size="large"
          className="add-btn"
        >
          New Template
        </Button>
      </div>

      <div className="table-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          allowClear
        />
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editing ? "Edit Template" : "New Template"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          autoComplete="off"
        >
          {/* Template Title */}
          <Form.Item
            label="Template Title"
            name="title"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              ref={titleInputRef}
              placeholder="e.g. Appointment Reminder"
              onKeyDown={(e) => handleKeyDown(e, subjectInputRef)}
            />
          </Form.Item>

          {/* Subject */}
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              ref={subjectInputRef}
              placeholder="Email or notification subject line"
              onKeyDown={(e) => handleKeyDown(e, messageTextAreaRef)}
            />
          </Form.Item>

          {/* Message */}
          <Form.Item
            label="Message Body"
            name="message"
            rules={[{ required: true, message: "Required" }]}
          >
            <TextArea
              ref={messageTextAreaRef}
              rows={5}
              placeholder="Write your message here."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  // Regular Enter - submit the form
                  e.preventDefault();
                  form.submit();
                } else if (e.key === 'Enter' && e.shiftKey) {
                  // Shift+Enter - allow new line (default behavior)
                  // Don't prevent default, let it create a new line
                  return;
                } else if (e.key === 'Enter' && e.ctrlKey) {
                  // Ctrl+Enter - also submit (optional)
                  e.preventDefault();
                  form.submit();
                }
              }}
            />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              ref={submitButtonRef}
              type="primary" 
              htmlType="submit" 
              loading={saving}
            >
              {editing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Templates;