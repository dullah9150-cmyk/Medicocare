// src/components/Appointments/Appointments.jsx
// Appointment scheduling linked to patients, stored in Firestore "appointments"

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
  Select,
  DatePicker,
  TimePicker,
  notification,
  Popconfirm,
  Space,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/module.css";

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS = {
  Scheduled: "blue",
  Completed: "green",
  Cancelled: "red",
  "No Show": "orange",
};

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  // Refs for keyboard navigation
  const patientSelectRef = useRef(null);
  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);
  const doctorInputRef = useRef(null);
  const statusSelectRef = useRef(null);
  const notesTextAreaRef = useRef(null);
  const submitButtonRef = useRef(null);

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db, "appointments"), (s) => {
        setAppointments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }),
      onSnapshot(collection(db, "patients"), (s) =>
        setPatients(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "Scheduled" });
    setModalOpen(true);
    
    // Focus on first field after modal opens
    setTimeout(() => {
      if (patientSelectRef.current) {
        patientSelectRef.current.focus();
      }
    }, 100);
  };

  const openEdit = (appt) => {
    setEditing(appt);
    form.setFieldsValue({
      ...appt,
      date: appt.date ? dayjs(appt.date) : null,
      time: appt.time ? dayjs(appt.time, "HH:mm") : null,
    });
    setModalOpen(true);
    
    // Focus on first field after modal opens
    setTimeout(() => {
      if (patientSelectRef.current) {
        patientSelectRef.current.focus();
      }
    }, 100);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const data = {
        patientId: values.patientId,
        date: values.date ? values.date.format("YYYY-MM-DD") : "",
        time: values.time ? values.time.format("HH:mm") : "",
        doctorName: values.doctorName,
        notes: values.notes || "",
        status: values.status,
        updatedAt: new Date().toISOString(),
      };

      if (editing) {
        await updateDoc(doc(db, "appointments", editing.id), data);
        notification.success({ message: "Appointment updated!" });
      } else {
        await addDoc(collection(db, "appointments"), {
          ...data,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        notification.success({ message: "Appointment scheduled!" });
      }
      setModalOpen(false);
    } catch (err) {
      notification.error({ message: "Error saving appointment", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "appointments", id));
      notification.success({ message: "Appointment deleted" });
    } catch (err) {
      notification.error({ message: "Delete failed" });
    }
  };

  const getPatientName = (id) => patients.find((p) => p.id === id)?.name || "Unknown";

  const filtered = appointments.filter((a) =>
    getPatientName(a.patientId).toLowerCase().includes(search.toLowerCase()) ||
    a.doctorName?.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation handler
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        if (nextRef.current.focus) {
          nextRef.current.focus();
        } else if (nextRef.current.querySelector('input')) {
          nextRef.current.querySelector('input').focus();
        } else if (nextRef.current.querySelector('.ant-select-selector')) {
          // For Select components, focus on the selector
          const selector = nextRef.current.querySelector('.ant-select-selector');
          if (selector) {
            selector.click();
            selector.focus();
          }
        }
      }
    }
  };

  const columns = [
    {
      title: "Patient",
      dataIndex: "patientId",
      render: (id) => (
        <span>
          <CalendarOutlined style={{ marginRight: 6, color: "#fa8c16" }} />
          <strong>{getPatientName(id)}</strong>
        </span>
      ),
    },
    { title: "Date", dataIndex: "date", sorter: (a, b) => a.date?.localeCompare(b.date) },
    { title: "Time", dataIndex: "time" },
    { title: "Doctor", dataIndex: "doctorName" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s}</Tag>,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      ellipsis: true,
      render: (t) => t || <span className="text-muted">—</span>,
    },
    {
      title: "Actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} className="action-btn edit" />
          <Popconfirm title="Delete this appointment?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
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
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{appointments.length} total appointments</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} size="large" className="add-btn">
          New Appointment
        </Button>
      </div>

      <div className="table-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by patient or doctor..."
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

      <Modal
        title={editing ? "Edit Appointment" : "Schedule Appointment"}
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
            label="Patient" 
            name="patientId" 
            rules={[{ required: true, message: "Select a patient" }]}
          >
            <Select
              ref={patientSelectRef}
              placeholder="Choose patient" 
              showSearch 
              optionFilterProp="children"
              onKeyDown={(e) => handleKeyDown(e, datePickerRef)}
            >
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} — {p.phone}</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="form-row">
            <Form.Item 
              label="Date" 
              name="date" 
              rules={[{ required: true, message: "Required" }]} 
              style={{ flex: 1 }}
            >
              <DatePicker 
                ref={datePickerRef}
                style={{ width: "100%" }} 
                onKeyDown={(e) => handleKeyDown(e, timePickerRef)}
              />
            </Form.Item>
            <Form.Item 
              label="Time" 
              name="time" 
              rules={[{ required: true, message: "Required" }]} 
              style={{ flex: 1 }}
            >
              <TimePicker 
                ref={timePickerRef}
                style={{ width: "100%" }} 
                format="HH:mm" 
                minuteStep={15}
                onKeyDown={(e) => handleKeyDown(e, doctorInputRef)}
              />
            </Form.Item>
          </div>

          <Form.Item 
            label="Doctor Name" 
            name="doctorName" 
            rules={[{ required: true, message: "Required" }]}
          >
            <Input 
              ref={doctorInputRef}
              placeholder="Dr. John Smith" 
              onKeyDown={(e) => handleKeyDown(e, statusSelectRef)}
            />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select
              ref={statusSelectRef}
              placeholder="Select status"
              onKeyDown={(e) => handleKeyDown(e, notesTextAreaRef)}
            >
              <Option value="Scheduled">Scheduled</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
              <Option value="No Show">No Show</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea 
              ref={notesTextAreaRef}
              rows={3} 
              placeholder="Additional notes or instructions... (Shift+Enter for new line)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  // Regular Enter - submit the form
                  e.preventDefault();
                  form.submit();
                }
                // Shift+Enter will create a new line (default behavior)
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
              {editing ? "Update Appointment" : "Schedule"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Appointments;