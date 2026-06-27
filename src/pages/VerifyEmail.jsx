import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, Button, Typography, Spin } from 'antd';
import { backendClient } from '../services/backendClient';

const { Title, Text } = Typography;

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const called = React.useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    
    const verifyToken = async () => {
      try {
        const res = await backendClient.verifyEmail(token);
        if (res.success) {
          setStatus('success');
          setMessage(res.message || 'Kích hoạt tài khoản thành công!');
        } else {
          setStatus('error');
          setMessage('Link kích hoạt không hợp lệ hoặc đã hết hạn.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi kích hoạt tài khoản.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-pink-300/30 blur-3xl mix-blend-multiply animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-orange-300/30 blur-3xl mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Card 
        className="relative z-10 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border-white/60 rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-xl"
        bodyStyle={{ padding: '40px 24px' }}
      >
        <div className="text-center py-2">
          <div className="flex justify-center mb-8">
            <img src="/drpig_logo.png" alt="Heo Hồng" className="h-16 w-auto object-contain drop-shadow-sm" />
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center animate-fade-in-up">
              <Spin size="large" className="mb-4" />
              <Text type="secondary" className="text-[14px]">Đang xác thực email của bạn...</Text>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-200">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <Title level={3} className="!m-0 !mb-3 text-gray-800 font-bold">Thành Công!</Title>
              <Text type="secondary" className="block mb-8 px-2 text-[15px] leading-relaxed">
                {message} Bạn có thể bắt đầu đăng nhập để dự đoán cùng Heo Hồng.
              </Text>
              <Button 
                type="primary"
                onClick={() => navigate('/matches')} 
                className="w-full rounded-xl h-[44px] bg-gradient-to-r from-[#ea4c89] to-[#ff8c42] hover:from-[#d6417a] hover:to-[#e67b35] border-0 shadow-md font-bold text-[15px] transition-transform active:scale-[0.98]"
              >
                Về Trang Chủ
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-red-200">
                <XCircle size={32} strokeWidth={2.5} />
              </div>
              <Title level={3} className="!m-0 !mb-3 text-gray-800 font-bold">Lỗi Xác Thực</Title>
              <Text type="secondary" className="block mb-8 px-2 text-[15px] leading-relaxed">
                {message}
              </Text>
              <Button 
                onClick={() => navigate('/matches')}
                className="w-full rounded-xl h-[44px] border-gray-200 text-gray-700 font-semibold hover:text-gray-900 hover:bg-gray-50 shadow-sm text-[15px]"
              >
                Về Trang Chủ
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
