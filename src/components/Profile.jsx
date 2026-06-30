import { useState, useEffect } from 'react';
import { TEAMS } from '../services/simulator';
import { useLanguage } from '../utils/LanguageContext';
import { Trophy, Wallet, Star, Heart, History, LogOut, Activity, Percent, ArrowRight, Settings, User as UserIcon, Lock, Camera, Gift, Share2 } from 'lucide-react';
import { Button, Card, Tabs, Tag, Statistic, Row, Col, Avatar, List, Typography, Empty, Form, Input, Alert } from 'antd';
import { backendClient } from '../services/backendClient';

export default function Profile({ user, onLogout, onSelectMatch, matches, onToggleFavoriteTeam, setUser }) {
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [form] = Form.useForm();
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);

  const [userBets, setUserBets] = useState([]);

  // Detect mobile for responsive tab positioning
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user._id) {
      backendClient.getProfile()
        .then(res => {
          if (res.success && res.user) {
            setUser({ ...user, ...res.user });
          }
        })
        .catch(err => console.error('Failed to fetch latest profile', err));

      // Fetch real bets
      backendClient.getUserBets()
        .then(res => {
          if (res.success && res.bets) {
            setUserBets(res.bets);
          }
        })
        .catch(err => console.error('Failed to fetch bets', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }} bordered={false}>
        <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <Typography.Title level={3}>{t('profileWalletTitle')}</Typography.Title>
        <Typography.Text type="secondary">{t('profileWalletDesc')}</Typography.Text>
      </Card>
    );
  }

  const totalBets = userBets.length;
  const wonBets = userBets.filter(b => b.status === 'WON').length;
  const lostBets = userBets.filter(b => b.status === 'LOST').length;
  const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets || 1)) * 100).toFixed(1) : '0.0';

  const formatXu = (value) => {
    return `${Math.round(value || 0).toLocaleString('vi-VN')} ${t('coinMascot')}`;
  };

  const bookmarkedMatches = (matches || []).filter(m => user.savedMatches && user.savedMatches.includes(m.id));
  const allTeamsList = Object.values(TEAMS);

  const tabs = [
    { id: 'WALLET', icon: Wallet, label: t('subTabWallet') },
    { id: 'SETTINGS', icon: Settings, label: 'Quản lý Tài Khoản' },
    { id: 'HISTORY', icon: History, label: t('subTabHistory') },
    { id: 'BOOKMARKS', icon: Star, label: t('subTabWatchlist') },
    { id: 'FAVORITES', icon: Heart, label: t('subTabFavorites') }
  ];

  const handleUpdateProfile = async (values) => {
    setUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const updatedUser = await backendClient.updateProfile(values);
      setUser({ ...user, ...updatedUser.user });
      setProfileSuccess('Cập nhật hồ sơ thành công!');
      if (values.newPassword) {
        form.setFieldsValue({ oldPassword: '', newPassword: '' });
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleShareReward = async () => {
    setIsSharing(true);
    // Open share window
    const shareUrl = encodeURIComponent(window.location.origin);
    const quote = encodeURIComponent('Chơi Gieo Quẻ mùa World Cup cùng Heo Hồng! 🐷💖');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${quote}`, '_blank', 'width=600,height=400');
    
    try {
      const res = await backendClient.claimShareReward();
      if (res.success) {
        setUser({ ...user, balance: res.balance, hasSharedForReward: true });
        setProfileSuccess('Heo Hồng đã chuyển 1,000 Xu vào túi bạn! Cảm ơn bạn đã lan toả yêu thương 🐷💖');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Có lỗi khi nhận thưởng.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto py-6 px-2 md:px-6">
      
      {!user.hasSharedForReward && (
        <div className="mb-6 bg-gradient-to-r from-[#ea4c89]/10 to-[#ff8c42]/10 border border-[#ea4c89]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#ea4c89]">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 m-0">Lan toả Heo Hồng - Nhận nóng 1,000 Xu!</h3>
              <p className="text-[13px] text-gray-500 m-0">Chia sẻ website để ủng hộ Heo Hồng và nhận ngay lộc lá nhé 🎁</p>
            </div>
          </div>
          <Button 
            type="primary" 
            icon={<Share2 size={16} />} 
            onClick={handleShareReward}
            loading={isSharing}
            style={{ backgroundColor: '#ea4c89', border: 'none', borderRadius: 8, fontWeight: 'bold', height: 40 }}
            className="shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            Chia sẻ ngay
          </Button>
        </div>
      )}

      <Row gutter={[24, 24]}>
        {/* Left Column: Profile Card */}
        <Col xs={24} md={8} lg={6}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl border border-gray-100/50"
            styles={{ body: { padding: '32px 24px' } }}
          >
            <div className="text-center flex flex-col items-center">
              <div className="relative mb-4 group rounded-full overflow-hidden w-[96px] h-[96px]">
                <Avatar
                  size={96}
                  src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api/v1', '')}${user.avatar}`) : null}
                  className="shadow-sm"
                  style={{ backgroundColor: '#ea4c89', fontSize: 32, fontWeight: 'bold' }}
                >
                  {!user.avatar && (user.initials || user.name.charAt(0))}
                </Avatar>
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => document.getElementById('avatar-upload').click()}
                >
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">Đổi Ảnh</span>
                </div>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const res = await backendClient.uploadAvatar(file);
                        if (res.success) {
                          const updatedUser = { ...user, avatar: res.user.avatar };
                          setUser(updatedUser);
                          localStorage.setItem('wc2026_user_profile', JSON.stringify(updatedUser));
                        }
                      } catch (err) {
                        console.error('Lỗi upload avatar', err);
                      }
                    }
                  }}
                />
              </div>
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
                {user.name}
              </Typography.Title>
              <Typography.Text type="secondary" className="mb-6">
                {user.email}
              </Typography.Text>

              <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <Typography.Text type="secondary" className="text-xs font-semibold uppercase tracking-wider block mb-1">
                  {t('availableBalance')}
                </Typography.Text>
                <div className="text-2xl font-bold text-gray-800">
                  {formatXu(user.balance)}
                </div>
              </div>

              <Button
                danger
                onClick={onLogout}
                icon={<LogOut size={16} />}
                block
                size="large"
                className="rounded-lg font-semibold"
              >
                {t('logoutBtn')}
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right Column: Tabs Content */}
        <Col xs={24} md={16} lg={18}>
          <Card
            bordered={false}
            className="shadow-sm rounded-xl border border-gray-100/50 min-h-[500px]"
            styles={{ body: { padding: 0 } }}
          >
            <Tabs
              defaultActiveKey="WALLET"
              size="large"
              tabPosition={isMobile ? 'top' : 'left'}
              className="ant-pro-tabs"
              items={tabs.map(tab => {
                const Icon = tab.icon;
                let content = null;

                if (tab.id === 'WALLET') {
                  content = (
                    <div className="p-6 md:p-8 animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                        <Typography.Title level={4} style={{ margin: 0 }}>Tổng quan ví</Typography.Title>
                      </div>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered className="bg-gray-50 border-gray-100 rounded-lg shadow-sm">
                            <Statistic
                              title={<span className="font-medium text-gray-500">{t('totalBetsLabel')}</span>}
                              value={totalBets}
                              prefix={<Activity size={18} className="text-blue-500 mr-2" />}
                              valueStyle={{ fontWeight: 700 }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered className="bg-green-50/50 border-green-100 rounded-lg shadow-sm">
                            <Statistic
                              title={<span className="font-medium text-green-700/70">{t('winRateLabel')}</span>}
                              value={winRate}
                              suffix="%"
                              prefix={<Percent size={18} className="text-green-500 mr-2" />}
                              valueStyle={{ fontWeight: 700, color: '#16a34a' }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small" bordered className="bg-orange-50/50 border-orange-100 rounded-lg shadow-sm">
                            <Statistic
                              title={<span className="font-medium text-orange-700/70">{t('wonLostLabel')}</span>}
                              value={`${wonBets}/${lostBets}`}
                              prefix={<Trophy size={18} className="text-orange-500 mr-2" />}
                              valueStyle={{ fontWeight: 700, color: '#ea580c' }}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  );
                } else if (tab.id === 'BOOKMARKS') {
                  content = (
                    <div className="p-6 md:p-8 animate-fade-in">
                      <Typography.Title level={4} style={{ marginBottom: 24 }}>{t('bookmarkedMatchesCount', { count: bookmarkedMatches.length })}</Typography.Title>

                      {bookmarkedMatches.length === 0 ? (
                        <Empty description={t('noBookmarksDesc')} className="my-10" />
                      ) : (
                        <List
                          itemLayout="horizontal"
                          dataSource={bookmarkedMatches}
                          renderItem={match => (
                            <List.Item
                              onClick={() => onSelectMatch(match.id)}
                              className="bg-white border border-gray-100 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors mb-3 px-5 py-4 shadow-sm"
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <img src={`https://flagcdn.com/w40/${match.home.flag}.png`} alt={match.home.name} className="w-5 h-3.5 object-cover rounded shadow-sm border border-gray-200" />
                                    <span className="font-semibold text-gray-800">{match.home.short}</span>
                                  </div>
                                  <span className="text-gray-400 text-sm">vs</span>
                                  <div className="flex items-center gap-2">
                                    <img src={`https://flagcdn.com/w40/${match.away.flag}.png`} alt={match.away.name} className="w-5 h-3.5 object-cover rounded shadow-sm border border-gray-200" />
                                    <span className="font-semibold text-gray-800">{match.away.short}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {match.status === 'LIVE' ? (
                                    <Tag color="red" className="m-0 font-semibold border-none">LIVE {match.minute}'</Tag>
                                  ) : match.status === 'FINISHED' ? (
                                    <Tag className="m-0 text-gray-500 border-none bg-gray-100">FT</Tag>
                                  ) : (
                                    <Typography.Text type="secondary" className="text-xs">{t('tabUpcoming')}</Typography.Text>
                                  )}
                                  <ArrowRight size={16} className="text-gray-400" />
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  );
                } else if (tab.id === 'FAVORITES') {
                  content = (
                    <div className="p-6 md:p-8 animate-fade-in">
                      <Typography.Title level={4} style={{ marginBottom: 24 }}>{t('favoriteTeamsTitle')}</Typography.Title>
                      <div className="flex flex-wrap gap-2 max-h-[500px] overflow-y-auto">
                        {allTeamsList.map(team => {
                          const isFav = user.favoriteTeams && user.favoriteTeams.includes(team.name);
                          return (
                            <Button
                              key={team.short}
                              type={isFav ? 'primary' : 'default'}
                              size="middle"
                              onClick={() => onToggleFavoriteTeam(team.name)}
                              icon={<Heart size={14} className={isFav ? 'fill-current' : ''} />}
                              className={`rounded-lg ${isFav ? 'bg-pink-500 hover:bg-pink-600 border-none' : 'text-gray-600 hover:text-pink-500 hover:border-pink-500'}`}
                            >
                              <img src={`https://flagcdn.com/w20/${team.flag}.png`} alt={team.name} className="w-4 h-3 object-cover rounded shadow-sm inline-block mr-1.5" />
                              {team.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else if (tab.id === 'HISTORY') {
                  content = (
                    <div className="p-6 md:p-8 animate-fade-in">
                      <Typography.Title level={4} style={{ marginBottom: 24 }}>{t('mockBetHistoryCount', { count: totalBets })}</Typography.Title>

                      {totalBets === 0 ? (
                        <Empty description={t('noMockBetsPlaced')} className="my-10" />
                      ) : (
                        <List
                          itemLayout="vertical"
                          dataSource={userBets}
                          renderItem={bet => {
                            const isPending = bet.status === 'PENDING';
                            const isWon = bet.status === 'WON';
                            const isLost = bet.status === 'LOST';
                            const isRefund = bet.status === 'REFUND';
                            
                            const matchTeams = bet.match ? `${bet.match.home.name} vs ${bet.match.away.name}` : bet.betName;

                            return (
                              <Card
                                size="small"
                                bordered
                                className="mb-3 rounded-lg shadow-sm border-gray-100"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-semibold text-gray-800">{matchTeams}</span>
                                  <Tag
                                    color={isPending ? 'processing' : isWon ? 'success' : isRefund ? 'default' : 'error'}
                                    className="m-0 rounded border-none font-medium"
                                  >
                                    {isWon ? t('statusWon') : isLost ? t('statusLost') : isRefund ? 'HOÀ XU' : t('statusPending')}
                                  </Tag>
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded flex justify-between items-center mb-3">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">{t('betHistoryPicked')}</div>
                                    <div className="font-semibold text-gray-800">{bet.betName} <span className="text-gray-400 font-normal ml-1">(@{bet.odds.toFixed(2)})</span></div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">{t('stakeLabel')}</div>
                                    <div className="font-semibold text-gray-800">{formatXu(bet.amount)}</div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-gray-400 uppercase">Ngày: {new Date(bet.createdAt).toLocaleDateString('vi-VN')}</span>
                                  <span className={`font-semibold text-sm ${isWon ? 'text-green-600' : isRefund ? 'text-gray-600' : isLost ? 'text-gray-400' : 'text-blue-600'}`}>
                                    {isWon
                                      ? `${t('betHistoryReturned')} +${formatXu(bet.payout)}`
                                      : isRefund
                                        ? `Đã hoàn +${formatXu(bet.amount)}`
                                        : isLost
                                          ? `${t('betHistoryReturned')} 0 ${t('coinMascot')}`
                                          : `${t('betHistoryEstPayout')} ${formatXu(bet.payout)}`}
                                  </span>
                                </div>
                              </Card>
                            );
                          }}
                        />
                      )}
                    </div>
                  );
                } else if (tab.id === 'SETTINGS') {
                  content = (
                    <div className="p-6 md:p-8 animate-fade-in max-w-lg">
                      <Typography.Title level={4} style={{ marginBottom: 24 }}>Cập nhật thông tin</Typography.Title>

                      {profileSuccess && <Alert message={profileSuccess} type="success" showIcon className="rounded-lg mb-6" />}
                      {profileError && <Alert message={profileError} type="error" showIcon className="rounded-lg mb-6" />}

                      <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        initialValues={{ name: user.name }}
                        requiredMark={false}
                        size="large"
                      >
                        <Form.Item label="Họ và tên hiển thị" name="name" className="mb-6">
                          <Input
                            prefix={<UserIcon size={16} className="text-gray-400 mr-2" />}
                            placeholder="Nhập tên của bạn"
                            className="rounded-lg"
                          />
                        </Form.Item>

                        {user.authProvider === 'local' && (
                          <div className="border border-gray-100 rounded-lg p-5 mb-6 bg-gray-50/50">
                            <Typography.Text strong className="block mb-4">Đổi mật khẩu</Typography.Text>

                            <Form.Item
                              label="Mật khẩu hiện tại"
                              name="oldPassword"
                              dependencies={['newPassword']}
                              className="mb-4"
                              rules={[
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value && getFieldValue('newPassword')) {
                                      return Promise.reject(new Error('Vui lòng nhập mật khẩu cũ'));
                                    }
                                    return Promise.resolve();
                                  },
                                }),
                              ]}
                            >
                              <Input.Password
                                prefix={<Lock size={16} className="text-gray-400 mr-2" />}
                                placeholder="Mật khẩu cũ"
                                className="rounded-lg"
                              />
                            </Form.Item>

                            <Form.Item
                              label="Mật khẩu mới"
                              name="newPassword"
                              className="mb-0"
                            >
                              <Input.Password
                                prefix={<Lock size={16} className="text-gray-400 mr-2" />}
                                placeholder="Mật khẩu mới"
                                className="rounded-lg"
                              />
                            </Form.Item>
                          </div>
                        )}

                        <Form.Item className="mb-0">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={updatingProfile}
                            className="w-full rounded-lg bg-pink-500 hover:bg-pink-600 border-none font-semibold"
                          >
                            Lưu Thay Đổi
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  );
                }

                return {
                  key: tab.id,
                  label: (
                    <span className="flex items-center gap-2 text-[14px]">
                      <Icon size={16} />
                      {tab.label}
                    </span>
                  ),
                  children: content
                };
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
