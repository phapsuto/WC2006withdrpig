import { useState, useEffect } from 'react';
import { getApiStats, resetApiStats } from '../utils/apiTracker';
import { getApiConfig, getActiveDataMode } from '../services/api';
import { Layout, Menu, Button, message } from 'antd';
import { Lock, LayoutDashboard, Users, Settings, RefreshCw, LogOut, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminSettings from './admin/AdminSettings';
import AdminMatches from './admin/AdminMatches';

const { Sider, Content } = Layout;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(getApiStats());
  const [config, setConfig] = useState(getApiConfig());
  const [activeMode, setActiveMode] = useState(getActiveDataMode());

  useEffect(() => {
    const handleStatsUpdate = () => {
      setStats(getApiStats());
    };
    window.addEventListener('api-stats-updated', handleStatsUpdate);
    return () => window.removeEventListener('api-stats-updated', handleStatsUpdate);
  }, []);

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả thống kê về 0?')) {
      resetApiStats();
      message.success('Đã đặt lại thống kê cuộc gọi API! 🐷');
    }
  };

  const setSuccessMessage = (msg) => {
    if(msg) message.success(msg);
  };

  const menuItems = [
    { key: 'overview', icon: <LayoutDashboard size={18} />, label: 'Tổng quan' },
    { key: 'matches', icon: <Trophy size={18} />, label: 'Trận đấu' },
    { key: 'users', icon: <Users size={18} />, label: 'Người dùng' },
    { key: 'settings', icon: <Settings size={18} />, label: 'Cấu hình API' },
  ];

  return (
    <Layout className="min-h-[70vh] bg-transparent rounded-3xl overflow-hidden shadow-lg border border-white/20">
      <Sider 
        width={240} 
        className="backdrop-blur-md border-r border-white/20"
        style={{ background: 'rgba(255, 255, 255, 0.45)' }}
        breakpoint="md"
        collapsedWidth="0"
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-6 px-2">
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight mb-1">
              <Lock size={20} className="text-primary" /> 
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Portal
              </span>
            </h1>
            <p className="text-[10px] text-on-surface-variant/85 font-semibold leading-tight">
              Quản trị hệ thống, dữ liệu và thiết lập nền tảng thời gian thực.
            </p>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            items={menuItems}
            style={{ background: 'transparent', border: 'none' }}
            className="flex-1 font-semibold text-sm custom-admin-menu"
          />

          <div className="pt-4 mt-auto border-t border-white/30 flex flex-col gap-2">
            <Button 
              danger
              icon={<RefreshCw size={14} />}
              onClick={handleReset} 
              className="w-full flex justify-start font-semibold text-xs rounded-xl h-10 border-danger/30 bg-danger/5 hover:bg-danger/10"
            >
              Reset thống kê
            </Button>
            <Button 
              icon={<LogOut size={14} />}
              onClick={() => navigate('/matches')}
              className="w-full flex justify-start font-semibold text-xs rounded-xl h-10 border-white/50 bg-white/40 hover:bg-white/60"
            >
              Thoát trang Admin
            </Button>
          </div>
        </div>
      </Sider>

      <Content className="p-4 md:p-6 relative overflow-y-auto min-h-0" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
        <div className="h-full">
          {activeTab === 'overview' && (
            <AdminOverview 
              stats={stats} 
              config={config} 
              activeMode={activeMode} 
            />
          )}
          {activeTab === 'matches' && (
            <AdminMatches />
          )}
          {activeTab === 'users' && (
            <AdminUsers />
          )}
          {activeTab === 'settings' && (
            <AdminSettings 
              config={config} 
              setConfig={setConfig} 
              setActiveMode={setActiveMode} 
              setSuccessMessage={setSuccessMessage} 
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}
