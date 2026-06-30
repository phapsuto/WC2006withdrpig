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
    
    const colorPrimary = isRefund ? '#6b7280' : isWon ? '#ea4c89' : '#4b5563'; 
    const gradientSecondary = isRefund ? '#9ca3af' : isWon ? '#ff8c42' : '#6b7280';
    const statusText = isRefund ? 'HOÀ QUẺ' : isWon ? 'LINH ỨNG' : 'TẠCH QUẺ';
    const statusEmoji = isRefund ? '🤝' : isWon ? '🎉' : '💔';
    
    const resultMessage = isRefund 
      ? `Trận đấu <strong>${matchName}</strong> đã khép lại với kết quả hoà. Bề trên thương xót trả lại <strong>+${amount.toLocaleString()} xu</strong> vào Heo Đất của bạn.`
      : isWon 
        ? `Quẻ của bạn cho trận <strong>${matchName}</strong> đã linh ứng thần kỳ! Heo Hồng xin phát lộc <strong>+${payout.toLocaleString()} xu</strong> cho bạn.`
        : `Rất tiếc, quẻ cho trận <strong>${matchName}</strong> hơi xui rồi! Bạn đã dâng lễ mất <strong>-${amount.toLocaleString()} xu</strong>. Đừng nản, thử xin quẻ khác xem sao!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">Kết Quả Trả Quẻ</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          
          <div style="background: linear-gradient(135deg, ${colorPrimary}15, ${gradientSecondary}15); border-left: 4px solid ${colorPrimary}; padding: 16px; margin: 24px 0; border-radius: 4px 8px 8px 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Trạng thái:</p>
            <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: ${colorPrimary};">${statusEmoji} ${statusText}</p>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Quẻ bạn xin:</p>
            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${betName}</p>
            
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Số Xu dâng lễ:</p>
            <p style="margin: 0 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">${amount.toLocaleString()} xu</p>
          </div>
          
          <p style="color: #1f2937; font-size: 16px; line-height: 1.6; text-align: center; background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
            ${resultMessage}
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
              Xem Heo Đất
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
      subject: `${statusEmoji} Kết quả trả quẻ: ${matchName}`,
      html: htmlContent,
    });

    console.log(`[Email] Bet result email sent to ${email} (Won: ${isWon})`);
    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send bet result email:', error);
    return false;
  }
};

const sendMatchReminderEmail = async (email, name, match) => {
  try {
    const transporter = createTransporter();
    const matchUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/matches`;
    const matchDate = new Date(match.date);
    
    // Format safely for VN timezone
    const timeFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
    const dateFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeString = timeFormatter.format(matchDate);
    const dateString = dateFormatter.format(matchDate);
    const matchName = `${match.home.name} vs ${match.away.name}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">cùng Heo Hồng</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${name},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Trận đấu bạn đang theo dõi sắp sửa diễn ra. Heo Hồng nhắc bạn nhớ chuẩn bị bỏng ngô và sẵn sàng lên sóng nhé!
          </p>
          
          <!-- Match VS Screen -->
          <div style="background: linear-gradient(135deg, #1f2937, #111827); border-radius: 12px; padding: 24px 16px; color: white; text-align: center; margin-bottom: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
            <div style="font-size: 14px; color: #9ca3af; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
              ${dateString} • ${timeString}
            </div>
            
            <div style="display: table; width: 100%; table-layout: fixed;">
              <!-- Home Team -->
              <div style="display: table-cell; width: 40%; text-align: center; vertical-align: middle;">
                <img src="${match.home.flag}" alt="${match.home.name}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2); background-color: white;" />
                <div style="margin-top: 10px; font-weight: bold; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${match.home.name}</div>
              </div>
              
              <!-- VS -->
              <div style="display: table-cell; width: 20%; text-align: center; vertical-align: middle; font-size: 28px; font-weight: 900; color: #ea4c89; font-style: italic; text-shadow: 0 2px 10px rgba(234,76,137,0.5);">
                VS
              </div>
              
              <!-- Away Team -->
              <div style="display: table-cell; width: 40%; text-align: center; vertical-align: middle;">
                <img src="${match.away.flag}" alt="${match.away.name}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2); background-color: white;" />
                <div style="margin-top: 10px; font-weight: bold; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${match.away.name}</div>
              </div>
            </div>
            
            ${match.league?.name ? `<div style="margin-top: 20px; font-size: 12px; color: #6b7280; font-weight: 600;">🏆 ${match.league.name}</div>` : ''}
          </div>
          
          <div style="background: linear-gradient(135deg, #ea4c8915, #ff8c4215); border-left: 4px solid #ea4c89; padding: 16px; margin: 24px 0; border-radius: 4px 8px 8px 4px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #ea4c89;">⚽ Đã đến lúc Gieo Quẻ!</p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Vào website ngay để theo dõi tỷ số trực tiếp và cùng tranh tài phân tích nhé.</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${matchUrl}" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(234,76,137,0.3);">
              Vào Gieo Quẻ Ngay
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Bạn nhận được email này vì đã ấn theo dõi trận đấu trên hệ thống Heo Hồng.
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

const sendNewsletterEmail = async (email, userName, top10News) => {
  try {
    const transporter = createTransporter();
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    // Generate HTML for the news list
    const newsHtmlList = top10News.map((news, index) => {
      // Determine the best image
      let imageUrl = 'https://loremflickr.com/400/200/soccer?lock=news' + index;
      if (news.localImage) {
        imageUrl = `${process.env.API_URL || 'http://localhost:5001'}${news.localImage}`;
      } else if (news.image) {
        imageUrl = news.image;
      }

      // Determine the link (either specific route or source)
      const newsLink = news.url ? news.url : `${baseUrl}/news`;

      return `
        <div style="display: flex; flex-direction: row; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;">
          <img src="${imageUrl}" alt="${news.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 16px; flex-shrink: 0;" />
          <div style="flex-grow: 1;">
            <a href="${newsLink}" style="text-decoration: none; color: #1f2937;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; line-height: 1.4;">${news.title}</h3>
            </a>
            <p style="margin: 0; font-size: 13px; color: #6b7280; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              ${news.summary || 'Click để xem chi tiết tin tức cập nhật mới nhất từ bóng đá thế giới...'}
            </p>
          </div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #f3f4f6;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ea4c89; margin: 0; font-size: 28px;">Worldcup 2026</h1>
          <p style="color: #ff8c42; margin: 4px 0 0 0; font-weight: bold;">Điểm Tin Cùng Heo Hồng</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào ${userName},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Heo Hồng vừa tổng hợp 10 bài viết nóng hổi nhất từ sân cỏ thế giới. Đọc ngay kẻo lỡ kèo thơm nha! 🐷🔥
          </p>
          
          <div style="margin-top: 24px;">
            ${newsHtmlList}
          </div>
          
          <div style="text-align: center; margin: 32px 0 0 0;">
            <a href="${baseUrl}/news" style="background: linear-gradient(135deg, #ea4c89 0%, #ff8c42 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(234,76,137,0.3);">
              Xem thêm tin khác
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Email này được gửi tự động từ hệ thống Heo Hồng News.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Heo Hồng News" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `📰 Điểm tin nóng hổi World Cup từ Heo Hồng!`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('[Email Error] Failed to send newsletter email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendBetResultEmail,
  sendMatchReminderEmail,
  sendNewsletterEmail
};
