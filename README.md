# 🐷 AI World Cup 2026 — Heo Hồng Tiên Tri 🏆

[![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![DeepSeek AI](https://img.shields.io/badge/FPT_AI-DeepSeek_V4-orange?logo=openai&logoColor=white)](https://fptcloud.com)

**AI World Cup 2026** là một nền tảng Web toàn diện đồng hành cùng giải vô địch bóng đá lớn nhất hành tinh. Với giao diện mang phong cách thiết kế **Bento Glassmorphic** thời thượng màu Hồng cam nổi bật, dự án tích hợp hệ thống dữ liệu bóng đá khổng lồ, nền tảng đặt cược (Betting) ảo, thu thập tin tức bóng đá tự động (News Scraper) và điểm nhấn là chuyên gia **AI Heo Hồng Tiên Tri** siêu thông minh.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. Hệ Thống Dữ Liệu Bóng Đá Theo Thời Gian Thực
- **Lịch thi đấu (Match Center):** Phân loại trận đấu thông minh (Đang đá, Sắp đá, Đã kết thúc), hiển thị tỉ số trực tiếp với hiệu ứng đồng hồ đếm phút nhấp nháy.
- **Chi tiết trận đấu (Match Detail):** Cung cấp đội hình ra sân, thống kê trận đấu (kiểm soát bóng, sút phạt, thẻ phạt), sơ đồ sân cỏ, và đặc biệt là hệ thống Video Highlights.
- **Bảng Xếp Hạng & Đội Tuyển:** Cập nhật bảng xếp hạng các bảng đấu, thông tin chi tiết từng đội tuyển và các cầu thủ.

### 2. Gieo Quẻ Tiên Tri & Đặt Cược (Virtual Betting)
- **Hệ thống Coin 🐷:** Đăng nhập để nhận ngay 500 Coin khởi nghiệp. 
- **Đặt cược:** Chọn kèo (1X2, Châu Á, Tài Xỉu) với tỉ lệ cược (Odds) cập nhật liên tục. Đặt cược và quản lý vé cược trong Bảng Điều Khiển (Dashboard).
- **AI Oracle (Heo Hồng):** Phân tích phong độ 2 đội và đưa ra lời khuyên đặt cược bằng mô hình **DeepSeek V4 Flash** mạnh mẽ.

### 3. Hệ Thống Đăng Nhập & Hồ Sơ (Auth & Profile)
- Hỗ trợ **Google OAuth 2.0** và đăng nhập truyền thống bằng JWT (Email/Password).
- Cho phép upload thay đổi Avatar (Tích hợp Multer).
- Tính năng Lưu Trận Đấu (Bookmark/Save Match) với **thông báo Email tự động** (Cron Job) trước giờ bóng lăn 30 phút.

### 4. Tin Tức Tự Động (News Scraper)
- Background worker sử dụng `node-cron` và `cheerio` tự động cào hàng nghìn bài báo mới nhất từ VnExpress, ThanhNien, TuoiTre mỗi 30 phút.
- Hệ thống quản lý trang tin tức (NewsHub) với phân trang, tìm kiếm mượt mà.

### 5. Quản Trị Hệ Thống (Admin Dashboard)
- Giao diện Admin quản lý Người dùng, Bài viết (News) và Cài đặt chung hệ thống.
- Cung cấp các thống kê tổng quan (Doanh thu ảo, Số vé cược...).

---

## 🛠 Tech Stack (Công Nghệ Sử Dụng)

### Frontend (Client-side)
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS + Ant Design 5
- **Icons:** Lucide React
- **State/Routing:** React Router DOM

### Backend (Server-side)
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JSON Web Token (JWT) + Google Auth Library
- **Task Scheduling:** Node-Cron (Gửi Email tự động, Cào tin tức)
- **Upload:** Multer (Xử lý avatar)
- **AI Integration:** OpenAI SDK kết nối qua FPT AI Marketplace (DeepSeek V4 Flash)

---

## 🚀 Hướng Dẫn Cài Đặt (Installation)

Dự án là một Monorepo chứa cả Frontend (root) và Backend (thư mục `/backend`).

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- MongoDB (Đang chạy local ở port 27017 hoặc dùng MongoDB Atlas)

### 2. Cài đặt thư viện
```bash
# Tại thư mục gốc (Cài đặt Frontend)
npm install

# Di chuyển vào thư mục backend và cài đặt Backend
cd backend
npm install
```

### 3. Cấu hình Biến môi trường (.env)

**Tạo file `.env` ở thư mục gốc (Frontend):**
```env
VITE_API_URL=http://localhost:5001/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Tạo file `.env` ở thư mục `backend/`:**
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/wc2026
JWT_SECRET=your_jwt_secret_key_wc2026
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_wc2026

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI (DeepSeek qua FPT AI)
FPT_AI_API_KEY=your_fpt_api_key
FPT_AI_BASE_URL=https://mkp-api.fptcloud.com/v1/chat/completions
FPT_AI_MODEL=DeepSeek-V4-Flash

# SMTP (Gửi Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Khởi chạy dự án

**Chạy Backend:**
```bash
cd backend
npm run dev
```

**Chạy Frontend:**
```bash
# Mở một terminal mới tại thư mục gốc
npm run dev
```

Mở trình duyệt tại: `http://localhost:5173`

---

## 🤝 Tham gia & Đóng Góp
- Hệ thống được thiết kế theo chuẩn mã nguồn mở thân thiện. Nếu bạn muốn thêm API bóng đá thực (như Sportmonks, API-Football), hãy tìm các file tương ứng trong `backend/services` để mở rộng.

## 📝 Giấy phép (License)
Dự án được bảo vệ theo giấy phép MIT. Hoàn toàn miễn phí cho mục đích học tập và giải trí cá nhân!
