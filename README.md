# World Cup 2026 cùng Heo Hồng Tiên Tri

Ứng dụng web toàn diện theo dõi và dự đoán kết quả Giải vô địch bóng đá thế giới World Cup 2026. Tích hợp AI để cung cấp các phân tích, nhận định bóng đá sắc bén và cập nhật dữ liệu trực tiếp từ Sportmonks.

## Tính năng nổi bật

1. **Lịch thi đấu & Kết quả Trực tiếp (Live Scores):**
   - Tự động cập nhật tỷ số trực tiếp, thời gian trận đấu (phút, giây) ngay trên giao diện mà không cần tải lại trang.
   - Sử dụng API chính thức từ Sportmonks.

2. **Heo Hồng Tiên Tri & Nhận định AI:**
   - Hệ thống AI phân tích phong độ, thống kê đối đầu lịch sử, đội hình và tỷ lệ nhà cái để đưa ra nhận định chi tiết trước mỗi trận đấu.
   - Gợi ý Kèo nhà cái Châu Á, Tài Xỉu, 1x2 cực kỳ chính xác kèm tỷ lệ rủi ro/độ an toàn và lời khuyên phân bổ vốn.

3. **Thông báo Thời gian thực (Real-time Notifications):**
   - Đánh dấu (Bookmark) theo dõi đội bóng hoặc trận đấu yêu thích.
   - Tự động hiển thị chuông reo và lưu vào danh sách "Đang theo dõi" của bạn. 

4. **Sự kiện Trận đấu (Match Events & Timeline):**
   - Tường thuật chi tiết các sự kiện quan trọng trong trận (Bàn thắng, Thẻ đỏ, Thẻ vàng, Thay người).
   - Tích hợp hình ảnh khoảnh khắc trực tiếp cho từng sự kiện quan trọng (Mocked Live Visuals) giúp diễn biến chân thực hơn.

5. **Tra cứu đa năng (Global Search):**
   - Công cụ tìm kiếm nhanh bất kỳ đội tuyển quốc gia, tin tức World Cup hay trận đấu nào ngay từ thanh Navbar.

## Công nghệ sử dụng

- **Frontend:** React, Vite, TailwindCSS, Ant Design, Lucide React.
- **Backend:** Node.js, Express, MongoDB (Mongoose).
- **External APIs:** 
  - [Sportmonks API](https://www.sportmonks.com/) (Dữ liệu bóng đá thời gian thực).
  - OpenAI / Gemini API (Nhận định bóng đá AI tự động).
- **Authentication:** JWT, Nodemailer (Quên mật khẩu/Xác minh email).

## Cài đặt & Khởi chạy (Local Development)

### Yêu cầu:
- Node.js (v18+)
- MongoDB chạy ở cổng mặc định `27017`
- Sportmonks API Key

### Hướng dẫn:

1. **Khởi chạy Backend (Cổng 5001):**
   ```bash
   cd backend
   npm install
   # Đảm bảo bạn đã cấu hình file .env
   npm run dev
   ```

2. **Khởi chạy Frontend (Cổng 5173):**
   ```bash
   # Từ thư mục gốc của project
   npm install
   npm run dev
   ```

3. **Biến môi trường cần thiết (`backend/.env`):**
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/wc2026_drpig
   JWT_SECRET=your_jwt_secret
   SPORTMONKS_API_TOKEN=your_sportmonks_api_key
   FRONTEND_URL=http://localhost:5173
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

## Bản quyền
Dự án nội bộ được phát triển riêng. All rights reserved.
