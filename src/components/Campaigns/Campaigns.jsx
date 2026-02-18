// src/components/Campaigns/Campaigns.jsx
// Campaign management: select template + target patients via searchable checkbox modal

import React, { useEffect, useState, useMemo } from "react";
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
  Select,
  notification,
  Popconfirm,
  Space,
  Tag,
  Checkbox,
  Avatar,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  NotificationOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/module.css";

const { Option } = Select;
const STATUS_COLORS = { Pending: "orange", Sent: "green" };

/* ─────────────────────────────────────────────
   PatientPickerModal
   Nested modal: search bar + Select All + 
   scrollable checkbox list of patients
───────────────────────────────────────────── */
const PatientPickerModal = ({ open, onClose, patients, selected, onConfirm }) => {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState(selected || []);

  // Sync when modal opens
  useEffect(() => {
    if (open) {
      setChecked(selected || []);
      setSearch("");
    }
  }, [open, selected]);

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.email?.toLowerCase().includes(search.toLowerCase())
      ),
    [patients, search]
  );

  const allFilteredIds = filtered.map((p) => p.id);
  const allChecked =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => checked.includes(id));
  const someChecked =
    allFilteredIds.some((id) => checked.includes(id)) && !allChecked;

  const toggleAll = (e) => {
    if (e.target.checked) {
      setChecked((prev) => [...new Set([...prev, ...allFilteredIds])]);
    } else {
      setChecked((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    }
  };

  const toggleOne = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(checked);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TeamOutlined style={{ color: "#1677ff", fontSize: 18 }} />
          <span>Select Target Patients</span>
          {checked.length > 0 && (
            <Badge
              count={checked.length === patients.length ? "All" : checked.length}
              style={{ backgroundColor: "#1677ff" }}
            />
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={560}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#8c8c8c", fontSize: 13 }}>
            {checked.length === 0
              ? "No patients selected"
              : checked.length === patients.length
              ? `All ${patients.length} patients selected`
              : `${checked.length} of ${patients.length} selected`}
          </span>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={checked.length === 0}
              icon={<CheckCircleFilled />}
            >
              Confirm Selection
            </Button>
          </Space>
        </div>
      }
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      {/* Search Bar */}
      <div style={{ padding: "16px 20px 12px" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {/* Select All Row */}
      <div
        style={{
          padding: "10px 20px",
          background: "#f8faff",
          borderTop: "1px solid #f0f0f0",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={toggleAll}
        >
          <span style={{ fontWeight: 600, color: "#262626" }}>
            {search
              ? `Select all matching (${filtered.length})`
              : "Select All Patients"}
          </span>
        </Checkbox>
        {checked.length > 0 && (
          <Button
            type="link"
            size="small"
            danger
            onClick={() => setChecked([])}
            style={{ padding: 0 }}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Scrollable Patient List */}
      <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8c8c8c" }}>
            No patients match your search
          </div>
        ) : (
          filtered.map((p) => {
            const isChecked = checked.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleOne(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 20px",
                  cursor: "pointer",
                  background: isChecked ? "#f0f7ff" : "transparent",
                  borderLeft: isChecked
                    ? "3px solid #1677ff"
                    : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isChecked) e.currentTarget.style.background = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) e.currentTarget.style.background = "transparent";
                }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleOne(p.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar
                  size={36}
                  style={{
                    backgroundColor: isChecked ? "#1677ff" : "#d9d9d9",
                    flexShrink: 0,
                    transition: "background 0.15s",
                    fontWeight: 600,
                  }}
                >
                  {p.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: isChecked ? 600 : 400,
                      color: "#262626",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#8c8c8c",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.email}
                  </div>
                </div>
                {isChecked && (
                  <CheckCircleFilled style={{ color: "#1677ff", fontSize: 16 }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────
   Main Campaigns Component
───────────────────────────────────────────── */
const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [audienceError, setAudienceError] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db, "campaigns"), (s) => {
        setCampaigns(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }),
      onSnapshot(collection(db, "patients"), (s) =>
        setPatients(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(collection(db, "templates"), (s) =>
        setTemplates(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const openAdd = () => {
    setEditing(null);
    setSelectedPatientIds([]);
    setAudienceError(false);
    form.resetFields();
    form.setFieldsValue({ status: "Pending" });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setSelectedPatientIds(c.patientIds || []);
    setAudienceError(false);
    form.setFieldsValue({
      name: c.name,
      templateId: c.templateId,
      status: c.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    if (selectedPatientIds.length === 0) {
      setAudienceError(true);
      notification.warning({ message: "Please select at least one patient" });
      return;
    }

    setSaving(true);
    try {
      const isAll = selectedPatientIds.length === patients.length;
      const data = {
        name: values.name,
        templateId: values.templateId,
        patientIds: selectedPatientIds,
        targetType: isAll ? "all" : "single",
        status: values.status || "Pending",
        updatedAt: new Date().toISOString(),
      };

      if (editing) {
        await updateDoc(doc(db, "campaigns", editing.id), data);
        notification.success({ message: "Campaign updated!" });
      } else {
        await addDoc(collection(db, "campaigns"), {
          ...data,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        notification.success({ message: "Campaign created!" });
      }
      setModalOpen(false);
    } catch (err) {
      notification.error({
        message: "Error saving campaign",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "campaigns", id));
      notification.success({ message: "Campaign deleted" });
    } catch (err) {
      notification.error({ message: "Delete failed" });
    }
  };

  const getTemplateName = (id) =>
    templates.find((t) => t.id === id)?.title || id;

  // Human-readable label for the audience trigger button
  const audienceLabel = useMemo(() => {
    if (selectedPatientIds.length === 0) return null;
    if (selectedPatientIds.length === patients.length)
      return `All Patients (${patients.length})`;
    if (selectedPatientIds.length === 1) {
      const p = patients.find((x) => x.id === selectedPatientIds[0]);
      return p?.name || "1 Patient";
    }
    return `${selectedPatientIds.length} Patients Selected`;
  }, [selectedPatientIds, patients]);

  const filtered = campaigns.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "name",
      render: (n) => (
        <span>
          <NotificationOutlined style={{ marginRight: 6, color: "#52c41a" }} />
          <strong>{n}</strong>
        </span>
      ),
    },
    {
      title: "Template",
      dataIndex: "templateId",
      render: (id) => <Tag color="purple">{getTemplateName(id)}</Tag>,
    },
    {
      title: "Target",
      dataIndex: "patientIds",
      render: (ids, r) =>
        r.targetType === "all" ? (
          <Tag color="blue">All Patients ({ids?.length})</Tag>
        ) : (
          <Tag color="cyan">
            {ids?.length === 1
              ? patients.find((p) => p.id === ids[0])?.name || "1 Patient"
              : `${ids?.length} Patients`}
          </Tag>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
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
            title="Delete campaign?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              className="action-btn delete"
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
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{campaigns.length} campaigns</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          size="large"
          className="add-btn"
        >
          New Campaign
        </Button>
      </div>

      <div className="table-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search campaigns..."
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
          scroll={{ x: 800 }}
        />
      </div>

      {/* ── Campaign Create / Edit Modal ── */}
      <Modal
        title={editing ? "Edit Campaign" : "New Campaign"}
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
          className="modal-form"
          autoComplete="off"
        >
          <Form.Item
            label="Campaign Name"
            name="name"
            rules={[{ required: true, message: "Please enter a campaign name" }]}
          >
            <Input placeholder="e.g. Summer Health Check Reminder" />
          </Form.Item>

          <Form.Item
            label="Template"
            name="templateId"
            rules={[{ required: true, message: "Please select a template" }]}
          >
            <Select placeholder="Select a message template">
              {templates.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Target Audience — triggers PatientPickerModal */}
          <Form.Item
            label="Target Audience"
            required
            validateStatus={audienceError ? "error" : ""}
            help={audienceError ? "Please select at least one patient" : ""}
          >
            <Button
              block
              size="large"
              icon={<TeamOutlined />}
              onClick={() => {
                setAudienceError(false);
                setPickerOpen(true);
              }}
              style={{
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                borderColor: audienceError
                  ? "#ff4d4f"
                  : selectedPatientIds.length > 0
                  ? "#1677ff"
                  : "#d9d9d9",
                color:
                  selectedPatientIds.length > 0 ? "#1677ff" : "#bfbfbf",
                fontWeight: selectedPatientIds.length > 0 ? 500 : 400,
              }}
            >
              <span style={{ flex: 1 }}>
                {audienceLabel || "Click to select patients..."}
              </span>
              {selectedPatientIds.length > 0 && (
                <Badge
                  count={
                    selectedPatientIds.length === patients.length
                      ? "All"
                      : selectedPatientIds.length
                  }
                  style={{ backgroundColor: "#1677ff" }}
                />
              )}
            </Button>
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select>
              <Option value="Pending">Pending</Option>
              <Option value="Sent">Sent</Option>
            </Select>
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ── Patient Picker (nested modal) ── */}
      <PatientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        patients={patients}
        selected={selectedPatientIds}
        onConfirm={(ids) => setSelectedPatientIds(ids)}
      />
    </div>
  );
};

export default Campaigns;