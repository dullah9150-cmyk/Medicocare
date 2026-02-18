// src/components/Patients/Patients.jsx
// Full CRUD for patients stored in Firestore "patients" collection

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Popconfirm,
  Tag,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/module.css";

const { Option } = Select;
const { TextArea } = Input;

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // current patient being edited
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  // Real-time subscription
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "patients"), (snap) => {
      setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    form.setFieldsValue(patient);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        // Update existing patient
        await updateDoc(doc(db, "patients", editing.id), {
          ...values,
          updatedAt: new Date().toISOString(),
        });
        notification.success({ message: "Patient updated!" });
      } else {
        // Add new patient
        await addDoc(collection(db, "patients"), {
          ...values,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        notification.success({ message: "Patient added!" });
      }
      setModalOpen(false);
    } catch (err) {
      notification.error({ message: "Error saving patient", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Check for related appointments before deleting
      const apptQuery = query(
        collection(db, "appointments"),
        where("patientId", "==", id)
      );
      const apptSnap = await getDocs(apptQuery);
      if (!apptSnap.empty) {
        notification.warning({
          message: "Cannot Delete",
          description: `This patient has ${apptSnap.size} appointment(s). Delete them first.`,
        });
        return;
      }
      await deleteDoc(doc(db, "patients", id));
      notification.success({ message: "Patient deleted" });
    } catch (err) {
      notification.error({ message: "Delete failed", description: err.message });
    }
  };

  // Filter by search input
  const filtered = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <span className="patient-name">
          <UserOutlined style={{ marginRight: 6, color: "#4f8ef7" }} />
          {name}
        </span>
      ),
    },
    { title: "Age", dataIndex: "age", width: 70 },
    {
      title: "Gender",
      dataIndex: "gender",
      width: 90,
      render: (g) => (
        <Tag color={g === "Male" ? "blue" : g === "Female" ? "pink" : "default"}>
          {g}
        </Tag>
      ),
    },
    { title: "Phone", dataIndex: "phone" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Medical History",
      dataIndex: "medicalHistory",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text?.slice(0, 40)}{text?.length > 40 ? "..." : ""}</span>
        </Tooltip>
      ),
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
            title="Delete this patient?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              className="action-btn delete"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{patients.length} registered patients</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          size="large"
          className="add-btn"
        >
          Add Patient
        </Button>
      </div>

      <div className="table-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search patients..."
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
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editing ? "Edit Patient" : "Add New Patient"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={580}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          size="middle"
          className="modal-form"
          autoComplete="off"
        >
          <div className="form-row">
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Patient full name" />
            </Form.Item>
            <Form.Item
              label="Age"
              name="age"
              rules={[{ required: true, message: "Required" }]}
              style={{ width: 100 }}
            >
              <Input type="number" min={0} max={130} placeholder="Age" />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Phone" name="phone" style={{ flex: 1 }}>
              <Input placeholder="+91 234 567 8900" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Enter valid email" }]}
          >
            <Input placeholder="patient@example.com" />
          </Form.Item>

          <Form.Item label="Medical History" name="medicalHistory">
            <TextArea rows={3} placeholder="Known conditions, allergies, medications..." />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? "Update Patient" : "Add Patient"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Patients;