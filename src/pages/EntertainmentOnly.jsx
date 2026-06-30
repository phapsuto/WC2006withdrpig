import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { ShieldAlert, PartyPopper, CheckCircle2, AlertTriangle, PiggyBank } from 'lucide-react';

export default function EntertainmentOnly() {
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-2 animate-fadeIn mt-8">
      {/* Header Banner */}
      <div className="relative mt-12">
        <div className="absolute -top-16 w-full flex justify-center z-20 pointer-events-none">
          <img src="/drpig_logo.png" alt="Heo Hồng" className="w-32 h-32 object-contain drop-shadow-2xl animate-float" />
        </div>
        <div
          className="rounded-3xl pt-16 pb-6 px-6 text-white shadow-lg text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(to right, #ea4c89, #ff8c42)' }}
        >
          <div className="absolute -top-10 -right-10 opacity-10">
            <PiggyBank size={150} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-2xl font-black mb-2 uppercase tracking-tight">
            {language === 'vi' ? 'Góc Giải Trí Lành Mạnh' : 'Responsible Gaming'}
          </h1>
          <p className="text-base font-medium opacity-90 max-w-2xl">
            {language === 'vi'
              ? 'Heo Hồng cam kết mang đến một sân chơi 100% vui vẻ, an toàn và hoàn toàn tuân thủ pháp luật.'
              : 'Dr. Pig is committed to providing a 100% fun, safe, and legally compliant playground.'}
          </p>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Vui là chính */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-[#2194ff]/10 text-[#2194ff] rounded-full flex items-center justify-center mb-4">
            <PartyPopper size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {language === 'vi' ? 'Trải Nghiệm Phi Lợi Nhuận' : 'Non-profit Experience'}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {language === 'vi'
              ? 'Tất cả các tính năng "Gieo quẻ", "Xin xăm" hay dự đoán trên website đều sử dụng Xu Ảo (Heo Đất) được cấp phát miễn phí. Hệ thống KHÔNG cho phép nạp/rút tiền thật dưới bất kỳ hình thức nào.'
              : 'All prediction features use virtual currency. The system DOES NOT allow real money deposits or withdrawals in any form.'}
          </p>
        </div>

        {/* Cảnh báo pháp luật */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-[#ea4c89]/10 text-[#ea4c89] rounded-full flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {language === 'vi' ? 'Nói Không Với Cá Độ' : 'No Gambling Allowed'}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {language === 'vi'
              ? 'Heo Hồng kịch liệt phản đối và lên án các hành vi cờ bạc, cá độ bóng đá ăn tiền. Mọi hành vi lợi dụng tính năng dự đoán của website để cá cược tiền thật bên ngoài đều là vi phạm pháp luật.'
              : 'We strongly condemn any form of real-money gambling. Using our platform\'s predictions to bet real money externally is strictly prohibited and illegal.'}
          </p>
        </div>
      </div>

      {/* Checklist cam kết */}
      <div className="mt-8 bg-gray-50 p-8 rounded-3xl border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          {language === 'vi' ? 'Quy Tắc Cộng Đồng Của Heo Hồng 🐷' : 'Dr. Pig\'s Community Rules 🐷'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            language === 'vi' ? 'Chơi vui là chính, gieo quẻ thử tài phân tích.' : 'Play for fun and test your analytical skills.',
            language === 'vi' ? 'Không cổ xúy cờ bạc, cá độ bất hợp pháp.' : 'No illegal gambling promotion.',
            language === 'vi' ? 'Nghiêm cấm lạm dụng kết quả để chuộc lợi cá nhân.' : 'Do not exploit results for personal gain.',
            language === 'vi' ? 'Mọi tài khoản vi phạm sẽ bị khóa vĩnh viễn.' : 'Violating accounts will be permanently banned.'
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
              <CheckCircle2 className="text-[#1bc165] flex-shrink-0 mt-0.5" size={20} />
              <span className="text-sm font-semibold text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chú ý cuối trang */}
      <div className="mt-8 flex items-center gap-4 bg-orange-50 border border-orange-200 p-6 rounded-2xl">
        <AlertTriangle className="text-orange-500 flex-shrink-0" size={32} />
        <div>
          <h4 className="font-bold text-orange-800 mb-1">
            {language === 'vi' ? 'Cảnh Báo Từ Heo Hồng' : 'Warning'}
          </h4>
          <p className="text-sm text-orange-700 leading-relaxed">
            {language === 'vi'
              ? 'Cá độ bóng đá mang lại rất nhiều hệ lụy cho bản thân, gia đình và xã hội. Hãy là một người hâm mộ bóng đá chân chính, xem bóng đá bằng niềm đam mê thay vì những canh bạc đỏ đen. Nếu phát hiện tài khoản có dấu hiệu khả nghi, Heo Hồng sẽ "bế" tài khoản đó đi ngay lập tức! 🚔'
              : 'Football gambling causes severe harm. Enjoy football with passion, not through bets. Suspicious accounts will be banned immediately!'}
          </p>
        </div>
      </div>
    </div>
  );
}
