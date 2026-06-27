import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { backendClient } from '../services/backendClient';
import { Shield, Award, Activity, ArrowLeft, User, Calendar, Ruler, TrendingUp, History, Star } from 'lucide-react';
import { Skeleton, Button, Tabs, Card, Row, Col, Tag, Avatar, Empty, Breadcrumb } from 'antd';

export default function PlayerDetail() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    backendClient.getPlayerDetails(playerId)
      .then(res => {
        if (res.success) setPlayerData(res.data);
        else setPlayerData(null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playerId]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  if (loading) {
    return (
      <div className="w-full bg-white h-full p-6 animate-pulse">
        <Skeleton avatar active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 6 }} className="mt-8" />
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="w-full bg-white h-full flex flex-col items-center justify-center text-center p-8">
        <Empty description="Không tải được dữ liệu cầu thủ" />
        <Button className="mt-4" icon={<ArrowLeft size={16}/>} onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  const age = calculateAge(playerData.dateOfBirth);
  const nationalTeam = playerData.teams?.find(t => t?.name?.toLowerCase()?.includes('national')) || null;
  const currentClub = playerData.teams?.find(t => !t?.name?.toLowerCase()?.includes('national')) || null;

  const renderOverview = () => (
    <div className="flex flex-col gap-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-[#151e22] mb-4 flex items-center gap-2">
              <User size={16} className="text-[var(--color-primary)]" /> Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-2 gap-y-4 text-[13px]">
              <div>
                <span className="text-[#6b7173] block mb-1">Ngày sinh</span>
                <span className="font-semibold text-[#151e22]">{playerData.dateOfBirth || 'Đang cập nhật'} {age ? `(${age} tuổi)` : ''}</span>
              </div>
              <div>
                <span className="text-[#6b7173] block mb-1">Quốc tịch</span>
                <div className="flex items-center gap-2">
                  {playerData.country && <img src={playerData.country.image} alt="flag" className="w-4 h-4 rounded-full object-cover" />}
                  <span className="font-semibold text-[#151e22]">{playerData.country?.name || 'Đang cập nhật'}</span>
                </div>
              </div>
              <div>
                <span className="text-[#6b7173] block mb-1">Chiều cao</span>
                <span className="font-semibold text-[#151e22]">{playerData.height ? `${playerData.height} cm` : 'Đang cập nhật'}</span>
              </div>
              <div>
                <span className="text-[#6b7173] block mb-1">Cân nặng</span>
                <span className="font-semibold text-[#151e22]">{playerData.weight ? `${playerData.weight} kg` : 'Đang cập nhật'}</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div className="bg-white rounded-[8px] p-5 shadow-sm border border-gray-100 h-full">
            <h3 className="text-[14px] font-bold text-[#151e22] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#2194ff]" /> Đội bóng hiện tại
            </h3>
            <div className="flex flex-col gap-3">
              {currentClub ? (
                <div className="flex items-center gap-3">
                  <Avatar src={currentClub.image} size={36} className="bg-gray-50 border border-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#151e22]">{currentClub.name}</span>
                    <span className="text-[12px] text-[#6b7173]">Câu lạc bộ</span>
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-gray-400">Chưa có thông tin CLB</div>
              )}
              
              {nationalTeam && (
                <div className="flex items-center gap-3 mt-2">
                  <Avatar src={nationalTeam.image} size={36} className="bg-gray-50 border border-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#151e22]">{nationalTeam.name}</span>
                    <span className="text-[12px] text-[#6b7173]">Đội tuyển Quốc gia</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0f0f0]">
        <h3 className="text-[14px] font-bold text-[#151e22] mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#ff495c]" /> Thống kê nổi bật (Tổng sự nghiệp)
        </h3>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[12px] text-[#6b7173] font-medium mb-1 uppercase tracking-wide">Số trận</span>
            <span className="text-[24px] font-bold text-[#151e22]">{playerData.stats?.appearances || 0}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[12px] text-[#6b7173] font-medium mb-1 uppercase tracking-wide">Bàn thắng</span>
            <span className="text-[24px] font-bold text-[#151e22]">{playerData.stats?.goals || 0}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[12px] text-[#6b7173] font-medium mb-1 uppercase tracking-wide">Kiến tạo</span>
            <span className="text-[24px] font-bold text-[#151e22]">{playerData.stats?.assists || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0f0f0]">
      <h3 className="text-[14px] font-bold text-[#151e22] mb-4 flex items-center gap-2">
        <Activity size={16} className="text-[var(--color-primary)]" /> Chỉ số chi tiết
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Bàn thắng</span>
          <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.goals || 0}</span>
        </div>
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Kiến tạo</span>
          <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.assists || 0}</span>
        </div>
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Số thẻ vàng</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 bg-[#ffb800] rounded-[2px] shadow-sm"></div>
            <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.yellowCards || 0}</span>
          </div>
        </div>
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Số thẻ đỏ</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 bg-[#ff495c] rounded-[2px] shadow-sm"></div>
            <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.redCards || 0}</span>
          </div>
        </div>
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Số phút thi đấu</span>
          <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.minutesPlayed || 0}'</span>
        </div>
        <div className="flex flex-col bg-[#f5f7f9] p-4 rounded-[6px] border border-gray-100">
          <span className="text-[12px] text-[#6b7173] mb-2 font-medium">Số trận ra sân</span>
          <span className="text-[18px] font-bold text-[#151e22]">{playerData.stats?.appearances || 0}</span>
        </div>
      </div>
    </div>
  );

  const renderTransfers = () => {
    if (!playerData.transfers || playerData.transfers.length === 0) {
      return (
        <div className="bg-white rounded-[8px] p-10 shadow-sm border border-gray-100 text-center">
          <History size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500 font-medium">Chưa có thông tin chuyển nhượng</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[8px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-[14px] font-bold text-[#151e22] flex items-center gap-2">
            <History size={16} className="text-[#2194ff]" /> Lịch sử chuyển nhượng
          </h3>
        </div>
        <div className="flex flex-col">
          {playerData.transfers.map((t, idx) => {
            const fromTeam = playerData.teams?.find(team => team.id === t.fromTeamId);
            const toTeam = playerData.teams?.find(team => team.id === t.toTeamId);
            return (
              <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors gap-3">
                <div className="text-[12px] font-semibold text-gray-500 w-[100px] text-center sm:text-left bg-gray-100 sm:bg-transparent px-2 py-1 rounded-full sm:rounded-none">
                  {t.date}
                </div>
                
                <div className="flex items-center justify-between flex-1 w-full gap-4">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-[14px] font-medium text-[#151e22] truncate text-right">
                      {fromTeam ? fromTeam.name : 'Unknown'}
                    </span>
                    <Avatar src={fromTeam?.image} size={28} className="bg-white border border-gray-200 shrink-0" />
                  </div>
                  
                  <div className="flex flex-col items-center mx-2 shrink-0">
                    <ArrowLeft size={16} className="text-gray-300 rotate-180" />
                    <span className="text-[10px] text-[#2194ff] mt-0.5">{t.type}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-start">
                    <Avatar src={toTeam?.image} size={28} className="bg-white border border-gray-200 shrink-0" />
                    <span className="text-[14px] font-bold text-[#151e22] truncate text-left">
                      {toTeam ? toTeam.name : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tabItems = [
    { key: 'overview', label: 'TỔNG QUAN', children: renderOverview() },
    { key: 'stats', label: 'CHỈ SỐ', children: renderStats() },
    { key: 'transfers', label: 'CHUYỂN NHƯỢNG', children: renderTransfers() },
  ];

  return (
    <div className="w-full bg-[#f5f7f9] h-full flex flex-col">
      {/* Light Header Style */}
      <div className="bg-white pt-6 pb-0 px-4 md:px-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb
              items={[
                { title: <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} className="text-[#6b7173] hover:text-[#151e22] flex items-center gap-1"><ArrowLeft size={14}/> Quay lại</a> },
                { title: <span className="text-[#151e22] font-medium">Hồ sơ cầu thủ</span> }
              ]}
              className="text-[12px]"
            />
          </div>

          <div className="flex items-end gap-6 mb-4">
            <div className="relative shrink-0">
              <div className="w-[88px] h-[88px] md:w-[100px] md:h-[100px] bg-white rounded-full p-1 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 z-10 relative">
                <img 
                  src={playerData.image || 'https://www.svgrepo.com/show/433152/user-circle.svg'} 
                  alt={playerData.name} 
                  className="w-full h-full object-cover rounded-full bg-gray-50"
                />
              </div>
              {playerData.country && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-sm z-20">
                  <img src={playerData.country.image} alt="flag" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col pb-2 w-full">
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#151e22] leading-tight mb-2 tracking-tight">
                {playerData.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[13px]">
                <Tag bordered={false} className="bg-gray-100 text-[#151e22] font-semibold rounded-[4px] px-2 py-0.5 text-[12px] m-0">
                  {playerData.position}
                </Tag>
                {currentClub && (
                  <span className="text-[#6b7173] flex items-center gap-1.5 font-medium">
                    <img src={currentClub.image} className="w-4 h-4 rounded-full object-cover" alt="club" />
                    {currentClub.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Antd Tabs nav area will be rendered here, but we put it outside */}
        </div>
      </div>

      {/* Tabs Component taking the rest of the height */}
      <Tabs 
        defaultActiveKey="overview" 
        items={tabItems.map(tab => ({
          ...tab,
          children: <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">{tab.children}</div>
        }))}
        className="player-detail-tabs custom-tabs-365 flex-1 flex flex-col min-h-0 bg-[#f5f7f9]"
        tabBarStyle={{ marginBottom: 0, paddingLeft: 'max(1rem, calc((100% - 56rem) / 2))', paddingRight: 'max(1rem, calc((100% - 56rem) / 2))', background: 'white', borderBottom: '1px solid #f0f0f0' }}
      />

      <style jsx="true">{`
        .player-detail-tabs > .ant-tabs-content-holder {
          flex: 1;
          overflow-y: auto;
        }
        .custom-tabs-365 .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .custom-tabs-365 .ant-tabs-tab {
          padding: 12px 16px !important;
          margin: 0 !important;
          color: #6b7173;
          font-size: 13px;
          font-weight: 700;
        }
        .custom-tabs-365 .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: var(--color-primary) !important;
        }
        .custom-tabs-365 .ant-tabs-ink-bar {
          background: var(--color-primary);
          height: 3px !important;
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </div>
  );
}
