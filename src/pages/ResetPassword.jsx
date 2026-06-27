import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { Card, Form, Input, Button, Alert, Typography } from 'antd';
import { backendClient } from '../services/backendClient';

const { Title, Text } = Typography;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await backendClient.resetPassword(token, values.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full  mix-blend-multiply animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Card
        className="relative z-10 w-full max-w-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border-white/60 rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-xl"
        bodyStyle={{ padding: '40px 24px' }}
      >
        {success ? (
          <div className="text-center py-4 animate-fade-in-up">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-200">
              <CheckCircle size={32} strokeWidth={2.5} />
            </div>
            <Title level={3} className="!m-0 !mb-3 text-gray-800 font-bold">Thành Công!</Title>
            <Text type="secondary" className="block mb-8 px-2 text-[15px] leading-relaxed">
              Mật khẩu của bạn đã được đặt lại an toàn. Bạn có thể đăng nhập ngay bây giờ.
            </Text>
            <Button
              type="primary"
              onClick={() => navigate('/matches')}
              className="w-full rounded-xl h-[44px] bg-gradient-to-r from-[#ea4c89] to-[#ff8c42] hover:from-[#d6417a] hover:to-[#e67b35] border-0 shadow-md font-bold text-[15px] transition-transform active:scale-[0.98]"
            >
              Quay lại Trang Chủ
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-pink-100">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <Title level={3} className="!m-0 !mb-2 text-gray-800 font-bold">
                Khôi Phục Mật Khẩu
              </Title>
              <Text type="secondary" className="text-[14px]">
                Tạo một mật khẩu mới bảo mật cho tài khoản.
              </Text>
            </div>

            {error && <Alert message={error} type="error" showIcon className="mb-6 rounded-xl border-red-100 bg-red-50 text-[14px]" />}

            <Form
              form={form}
              name="reset_form"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="middle"
            >
              <Form.Item
                name="password"
                className="mb-4"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
              >
                <Input.Password
                  prefix={<Lock size={16} className="text-gray-400 mr-2" />}
                  placeholder="Mật khẩu mới"
                  className="rounded-xl border-gray-200 h-[44px] bg-white/50 focus:bg-white text-[14px] backdrop-blur-sm transition-colors"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                className="mb-8"
                rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu mới!' }]}
              >
                <Input.Password
                  prefix={<Lock size={16} className="text-gray-400 mr-2" />}
                  placeholder="Nhập lại mật khẩu mới"
                  className="rounded-xl border-gray-200 h-[44px] bg-white/50 focus:bg-white text-[14px] backdrop-blur-sm transition-colors"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full rounded-xl h-[44px] bg-gradient-to-r from-[#ea4c89] to-[#ff8c42] hover:from-[#d6417a] hover:to-[#e67b35] border-0 shadow-md shadow-pink-200 font-bold text-[15px] transition-transform active:scale-[0.98]"
                >
                  Xác Nhận Đổi Mật Khẩu
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Card>
    </div>
  );
}
