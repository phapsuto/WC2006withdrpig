const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">cùng Heo Hồng</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>Worldcup 2026 cùng Heo Hồng</strong>. 
            Để bắt đầu dự đoán các trận đấu đỉnh cao, vui lòng kích hoạt tài khoản của bạn bằng cách nhấn vào nút bên dưới:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
              Kích Hoạt Tài Khoản
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
            Nếu nút bấm không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt:<br>
            <a href="${verificationUrl}" style="color: #ea4c89; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Email này được gửi tự động. Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Heo Hồng Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🎯 Kích hoạt tài khoản - Worldcup 2026 cùng Heo Hồng',
      html: htmlContent,
    });

    console.log(`[Email] Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send verification email:', error);
    // Even if it fails (e.g. SMTP not configured yet), we might just log it and proceed so dev environment doesn't break
    return false;
  }
};

const sendResetPasswordEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">cùng Heo Hồng</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>Worldcup 2026 cùng Heo Hồng</strong> của bạn.
            Để đặt lại mật khẩu mới, vui lòng nhấn vào nút bên dưới:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
              Khôi Phục Mật Khẩu
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
            Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Link này sẽ hết hạn sau 15 phút.<br><br>
            Nếu nút bấm không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt:<br>
            <a href="${resetUrl}" style="color: #ea4c89; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Email này được gửi tự động. Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Heo Hồng Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '🔒 Khôi phục mật khẩu - Worldcup 2026 cùng Heo Hồng',
      html: htmlContent,
    });

    console.log(`[Email] Reset password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send reset password email:', error);
    return false;
  }
};

const sendBetResultEmail = async (email, name, matchName, betName, amount, payout, isWon, isRefund = false) => {
  try {
    const transporter = createTransporter();
    
    const colorPrimary = isRefund ? '#6b7280' : isWon ? '#10b981' : '#ef4444'; 
    const gradientSecondary = isRefund ? '#9ca3af' : isWon ? '#34d399' : '#f87171';
    const statusText = isRefund ? 'HOÀ CƯỢC' : isWon ? 'CHIẾN THẮNG' : 'THUA CƯỢC';
    const statusEmoji = isRefund ? '🤝' : isWon ? '🎉' : '💔';
    const resultMessage = isRefund 
      ? `Trận đấu kết thúc với kết quả hoà cược. Hệ thống đã hoàn trả <strong>+${amount.toLocaleString()} xu</strong> tiền cược vào ví của bạn.`
      : isWon 
        ? `Chúc mừng! Vé cược của bạn đã thắng. Bạn nhận được <strong>+${payout.toLocaleString()} xu</strong>.`
        : `Rất tiếc! Vé cược của bạn đã thua. Bạn đã mất <strong>-${amount.toLocaleString()} xu</strong>. Đừng nản lòng, hãy thử lại nhé!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: ${colorPrimary}; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: ${gradientSecondary}; margin: 4px 0 0 0; font-weight: bold;">Kết Quả Gieo Quẻ</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Trận đấu <strong>${matchName}</strong> đã kết thúc. Dưới đây là kết quả cho vé cược của bạn:
          </p>
          
          <div style="background: linear-gradient(135deg, ${colorPrimary}15, ${gradientSecondary}15); border-left: 4px solid ${colorPrimary}; padding: 16px; margin: 24px 0; border-radius: 4px 8px 8px 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Trạng thái:</p>
            <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: ${colorPrimary};">${statusEmoji} ${statusText}</p>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Lựa chọn của bạn:</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${betName}</p>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Số tiền cược:</p>
            <p style="margin: 0 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">${amount.toLocaleString()} xu</p>
          </div>
          
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; text-align: center; background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
            ${resultMessage}
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="background: linear-gradient(135deg, ${colorPrimary} 0%, ${gradientSecondary} 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
              Xem Số Dư Ví
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Email này được gửi tự động từ hệ thống Heo Hồng.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Heo Hồng Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${statusEmoji} Kết quả cá cược: ${matchName}`,
      html: htmlContent,
    });

    console.log(`[Email] Bet result email sent to ${email} (Won: ${isWon})`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send bet result email:', error);
    return false;
  }
};

const sendMatchReminderEmail = async (email, name, matchName, startTime) => {
  try {
    const transporter = createTransporter();
    const matchUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/matches`;
    const timeString = new Date(startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">cùng Heo Hồng</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Trận đấu bạn đang theo dõi: <strong>${matchName}</strong> sẽ diễn ra vào lúc <strong>${timeString}</strong> (sắp bắt đầu).
          </p>
          
          <div style="background: linear-gradient(135deg, #ea4c8915, #ff8c4215); border-left: 4px solid #ea4c89; padding: 16px; margin: 24px 0; border-radius: 4px 8px 8px 4px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #ea4c89;">⚽ Đã đến lúc Gieo Quẻ!</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Đừng bỏ lỡ cơ hội dự đoán kết quả và nhận thưởng xu cực khủng từ Heo Hồng.</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${matchUrl}" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
              Vào Gieo Quẻ Ngay
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Bạn nhận được email này vì đã ấn theo dõi trận đấu trên hệ thống.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Heo Hồng Thông Báo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⏰ [Nhắc Nhở] Trận đấu ${matchName} sắp diễn ra!`,
      html: htmlContent,
    });

    console.log(`[Email] Match reminder email sent to ${email} for ${matchName}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send match reminder email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendBetResultEmail,
  sendMatchReminderEmail
};
