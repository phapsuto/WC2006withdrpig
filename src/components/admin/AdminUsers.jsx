import { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, InputNumber, message } from 'antd';
import { Users, PlusCircle } from 'lucide-react';
import { backendClient } from '../../services/backendClient';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addAmount, setAddAmount] = useState(500);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await backendClient.getAllUsers();
      if (res.success) {
        setUsers(res.users);
      } else {
        message.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddBalance = (user) => {
    setSelectedUser(user);
    setAddAmount(500); // Default add amount
    setIsModalVisible(true);
  };

  const handleAddBalance = async () => {
    if (!selectedUser || !addAmount) return;
    
    try {
      setActionLoading(true);
      const res = await backendClient.addBalance(selectedUser._id, addAmount);
      if (res.success) {
        message.success(`Đã cộng ${addAmount} điểm cho ${selectedUser.name}`);
        setIsModalVisible(false);
        fetchUsers(); // Refresh list
      } else {
        message.error(res.message || 'Cộng điểm thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi hệ thống khi cộng điểm');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên / Email',
      key: 'user',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[var(--365-text-main)]">{record.name}</span>
          <span className="text-xs text-[var(--365-text-muted)]">{record.email}</span>
        </div>
      )
    },
    {
      title: 'Phân quyền',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'volcano' : 'green'} className="uppercase text-[9px] font-bold">
          {role}
        </Tag>
      )
    },
    {
      title: 'Đăng nhập',
      dataIndex: 'authProvider',
      key: 'authProvider',
      render: (auth) => (
        <Tag className="uppercase text-[9px] font-bold">
          {auth}
        </Tag>
      )
    },
    {
      title: 'Số dư (Điểm)',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <span className="font-bold text-[var(--365-primary)]">
          {balance?.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="text-xs">
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button 
            size="small" 
            type="primary" 
            icon={<PlusCircle size={14} />} 
            onClick={() => handleOpenAddBalance(record)}
            className="text-[11px] font-semibold flex items-center bg-[var(--365-primary)]"
          >
            Cộng điểm
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="bento-glass p-6 space-y-4 animate-fade-in flex-1">
      <div className="flex justify-between items-center pb-2 border-b border-white/40">
        <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase">
          <Users size={16} className="text-primary" /> Quản lý Người dùng
        </h3>
        <Button size="small" onClick={fetchUsers} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-inner">
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </div>

      <Modal
        title={
          <span className="font-bold text-[var(--365-text-main)]">
            Cộng điểm: {selectedUser?.name}
          </span>
        }
        open={isModalVisible}
        onOk={handleAddBalance}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={actionLoading}
        okText="Xác nhận cộng"
        cancelText="Huỷ bỏ"
        centered
        width={350}
      >
        <div className="flex flex-col gap-3 py-4">
          <div className="text-sm">
            Nhập số điểm muốn cộng cho người dùng <strong>{selectedUser?.email}</strong> (Số dư hiện tại: <strong className="text-[var(--365-primary)]">{selectedUser?.balance}</strong>)
          </div>
          <InputNumber 
            style={{ width: '100%' }}
            size="large"
            value={addAmount}
            onChange={setAddAmount}
            min={1}
            max={100000}
            step={100}
            addonAfter="Điểm"
          />
          <div className="flex gap-2 mt-2">
            <Button size="small" onClick={() => setAddAmount(500)}>+500</Button>
            <Button size="small" onClick={() => setAddAmount(1000)}>+1000</Button>
            <Button size="small" onClick={() => setAddAmount(5000)}>+5000</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
