import { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, InputNumber, message, Space, Typography } from 'antd';
import { Trophy, CheckCircle, Play } from 'lucide-react';
import { backendClient } from '../../services/backendClient';

const { Text } = Typography;

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // We can fetch today's matches or all matches. Let's use getMatches.
      const res = await backendClient.getMatches();
      if (res.success) {
        // Sort by date, upcoming first
        const sorted = res.matches.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMatches(sorted);
      } else {
        message.error('Không thể tải danh sách trận đấu');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi tải danh sách trận đấu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleOpenSimulate = (match) => {
    setSelectedMatch(match);
    setHomeScore(match.homeScore || 0);
    setAwayScore(match.awayScore || 0);
    setSimulateModalVisible(true);
  };

  const handleSimulateFinish = async () => {
    if (!selectedMatch) return;
    
    try {
      setActionLoading(true);
      const res = await backendClient.simulateFinishMatch(selectedMatch.id, homeScore, awayScore);
      if (res.success) {
        message.success(res.message || 'Đã chốt kết quả và trả thưởng thành công!');
        setSimulateModalVisible(false);
        fetchMatches(); // Refresh list
      } else {
        message.error(res.message || 'Thao tác thất bại');
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi hệ thống khi chốt kết quả');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <Text type="secondary" className="text-xs">
          {new Date(date).toLocaleString('vi-VN')}
        </Text>
      )
    },
    {
      title: 'Trận đấu',
      key: 'match',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 w-24 justify-end">
            <span className="font-semibold text-sm">{record.home.name}</span>
            <img src={`https://flagcdn.com/w20/${record.home.flag}.png`} alt="home" className="w-5 h-3.5 object-cover rounded shadow-sm" />
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded font-bold text-[var(--365-text-main)]">
            {record.status === 'UPCOMING' ? 'vs' : `${record.homeScore} - ${record.awayScore}`}
          </div>
          <div className="flex items-center gap-2 w-24 justify-start">
            <img src={`https://flagcdn.com/w20/${record.away.flag}.png`} alt="away" className="w-5 h-3.5 object-cover rounded shadow-sm" />
            <span className="font-semibold text-sm">{record.away.name}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'LIVE' ? 'red' : status === 'FINISHED' ? 'default' : 'processing';
        return <Tag color={color} className="font-bold">{status}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status !== 'FINISHED' && (
            <Button 
              size="small" 
              type="primary" 
              danger
              icon={<CheckCircle size={14} />} 
              onClick={() => handleOpenSimulate(record)}
              className="text-[11px] font-semibold flex items-center"
            >
              Mô phỏng Kết thúc
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="bento-glass p-6 space-y-4 animate-fade-in flex-1">
      <div className="flex justify-between items-center pb-2 border-b border-white/40">
        <h3 className="text-xs font-semibold text-on-surface flex items-center gap-1.5 uppercase">
          <Trophy size={16} className="text-primary" /> Quản lý Trận đấu (Gieo Quẻ)
        </h3>
        <Button size="small" onClick={fetchMatches} loading={loading} icon={<Play size={12} />}>
          Làm mới
        </Button>
      </div>
      
      <div className="mb-4">
        <Text type="secondary" className="text-xs">
          Bạn có thể "Mô phỏng kết thúc" một trận đấu để hệ thống chốt các vé cược, tính toán Thắng/Thua, tự động cộng tiền và gửi Email thông báo cho người dùng.
        </Text>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-inner">
        <Table 
          columns={columns} 
          dataSource={matches} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }}
          size="small"
        />
      </div>

      <Modal
        title={<span className="font-bold text-[var(--365-text-main)]">Chốt kết quả trận đấu</span>}
        open={simulateModalVisible}
        onOk={handleSimulateFinish}
        onCancel={() => setSimulateModalVisible(false)}
        confirmLoading={actionLoading}
        okText="Lưu & Chốt Cược"
        cancelText="Huỷ bỏ"
        centered
        width={400}
      >
        {selectedMatch && (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center text-sm text-gray-500 bg-orange-50 p-3 rounded-lg border border-orange-100">
              Hành động này sẽ cập nhật trạng thái trận đấu thành <strong>FINISHED</strong>, xử lý tính toán trả thưởng cho tất cả các vé cược PENDING và <strong>gửi Email</strong> tới người chơi.
            </div>
            
            <div className="flex justify-between items-center px-4">
              <div className="flex flex-col items-center gap-2">
                <img src={`https://flagcdn.com/w40/${selectedMatch.home.flag}.png`} alt="home" className="w-10 h-7 object-cover rounded shadow" />
                <span className="font-semibold text-sm">{selectedMatch.home.name}</span>
                <InputNumber 
                  min={0} 
                  max={20} 
                  value={homeScore} 
                  onChange={setHomeScore} 
                  size="large"
                  className="w-16 text-center font-bold text-lg"
                />
              </div>
              
              <div className="text-xl font-bold text-gray-300">-</div>
              
              <div className="flex flex-col items-center gap-2">
                <img src={`https://flagcdn.com/w40/${selectedMatch.away.flag}.png`} alt="away" className="w-10 h-7 object-cover rounded shadow" />
                <span className="font-semibold text-sm">{selectedMatch.away.name}</span>
                <InputNumber 
                  min={0} 
                  max={20} 
                  value={awayScore} 
                  onChange={setAwayScore} 
                  size="large"
                  className="w-16 text-center font-bold text-lg"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
