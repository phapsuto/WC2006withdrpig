import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Divider, Alert, Typography } from 'antd';
import { Mail, Lock, User as UserIcon, ArrowLeft, X } from 'lucide-react';
import { backendClient } from '../services/backendClient';
import { GoogleLogin } from '@react-oauth/google';

const { Title, Text } = Typography;

export default function AuthModal({ isOpen, onClose, setUser }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastEmail, setLastEmail] = useState('');
  const [form] = Form.useForm();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('login');
      setError('');
      setSuccess('');
      form.resetFields();
    }
  }, [isOpen, form]);

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
        setLastEmail(values.email);
        const res = await backendClient.login({ email: values.email, password: values.password });
        if (res.success) {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('wc2026_user_profile', JSON.stringify(res.user)); // Sync with App.jsx
          setUser(res.user);
          onClose();
        }
      } else if (view === 'register') {
        const res = await backendClient.register(values);
        if (res.success) {
          setSuccess(res.message);
          form.resetFields();
          // Don't auto-login, wait for user to verify email
          // We can optionally switch to login view, but keeping the success message is good.
          setView('login'); 
        }
      } else if (view === 'forgot') {
        const res = await backendClient.forgotPassword(values.email);
        if (res.success) {
          setSuccess(res.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!lastEmail) return;
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await backendClient.resendVerification(lastEmail);
      if (res.success) {
        setSuccess(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi gửi lại email kích hoạt!');
    } finally {
      setResendLoading(false);
    }
  };



  const handleGoogleCredentialResponse = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await backendClient.googleLogin({ token: credentialResponse.credential });
      if (res.success) {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('wc2026_user_profile', JSON.stringify(res.user)); 
        setUser(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập Google thất bại!');
    } finally {
      setLoading(false);
    }
  };



  const toggleView = (newView) => {
    setView(newView);
    setError('');
    setSuccess('');
    form.resetFields();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={380}
      centered
      destroyOnClose
      className="auth-modal"
      classNames={{
        content: '!p-0 overflow-hidden rounded-[24px]',
        mask: 'backdrop-blur-sm bg-black/40'
      }}
      closeIcon={<X size={20} className="text-gray-400 hover:text-gray-700 transition-colors mt-2 mr-2" />}
    >
      <div className="p-4 pt-6">
        <div className="text-center mb-6">

          <Title level={3} className="!m-0 !mb-1 text-gray-800">
            {view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Đăng Ký' : 'Quên Mật Khẩu'}
          </Title>
          <Text type="secondary" className="text-[14px]">
            {view === 'login' ? 'Chào mừng bạn quay lại!' : view === 'register' ? 'Bắt đầu dự đoán với Heo Hồng' : 'Khôi phục tài khoản của bạn'}
          </Text>
        </div>

        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            className="mb-6 rounded-xl border-red-100 bg-red-50"
            action={
              error.includes('chưa được kích hoạt') ? (
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={handleResendVerification} 
                  loading={resendLoading}
                  className="bg-pink-500 border-none hover:bg-pink-600 text-[12px] font-semibold rounded-lg"
                >
                  Gửi lại Email
                </Button>
              ) : null
            }
          />
        )}
        {success && <Alert message={success} type="success" showIcon className="mb-6 rounded-xl border-green-100 bg-green-50" />}

        <Form
          form={form}
          name="auth_form"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          size="middle"
        >
          {view === 'register' && (
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              className="mb-4"
            >
              <Input 
                prefix={<UserIcon size={16} className="text-gray-400 mr-2" />} 
                placeholder="Họ và tên" 
                className="rounded-xl border-gray-200 h-[44px] bg-gray-50/50 focus:bg-white text-[14px]"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
            className="mb-4"
          >
            <Input 
              prefix={<Mail size={16} className="text-gray-400 mr-2" />} 
              placeholder="Địa chỉ Email" 
              className="rounded-xl border-gray-200 h-[44px] bg-gray-50/50 focus:bg-white text-[14px]"
            />
          </Form.Item>

          {view !== 'forgot' && (
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              className="mb-2"
            >
              <Input.Password 
                prefix={<Lock size={16} className="text-gray-400 mr-2" />} 
                placeholder="Mật khẩu" 
                className="rounded-xl border-gray-200 h-[44px] bg-gray-50/50 focus:bg-white text-[14px]"
              />
            </Form.Item>
          )}

          {view === 'login' && (
            <div className="flex justify-end mb-6">
              <Button type="link" size="small" onClick={() => toggleView('forgot')} className="text-pink-500 hover:text-pink-600 p-0 font-medium">
                Quên mật khẩu?
              </Button>
            </div>
          )}

          <Form.Item className={view !== 'login' ? 'mt-6 mb-0' : 'mb-0'}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              className="w-full rounded-xl h-[44px] bg-gradient-to-r from-[#ea4c89] to-[#ff8c42] hover:from-[#d6417a] hover:to-[#e67b35] border-0 shadow-md font-bold text-[15px] transition-transform active:scale-[0.98]"
            >
              {view === 'login' ? 'Đăng Nhập' : view === 'register' ? 'Tạo Tài Khoản' : 'Gửi Yêu Cầu'}
            </Button>
          </Form.Item>
        </Form>

        {view === 'login' && (
          <>
            <Divider className="my-6 text-gray-400 text-[13px] uppercase font-semibold">Hoặc</Divider>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleCredentialResponse}
                onError={() => setError('Đăng nhập Google thất bại!')}
                theme="outline"
                size="large"
                shape="rectangular"
                width="320"
                text="continue_with"
              />
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          {view === 'login' ? (
            <Text className="text-gray-500 font-medium text-[13px]">
              Chưa có tài khoản?{' '}
              <Button type="link" onClick={() => toggleView('register')} className="text-[#ea4c89] hover:text-[#ff8c42] p-0 font-bold transition-colors text-[13px]">
                Đăng ký ngay
              </Button>
            </Text>
          ) : (
            <Button type="link" onClick={() => toggleView('login')} className="text-gray-500 hover:text-[#ea4c89] p-0 font-bold flex items-center justify-center gap-1.5 w-full mx-auto transition-colors text-[13px]">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
