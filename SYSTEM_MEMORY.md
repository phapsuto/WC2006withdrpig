# 🧠 SYSTEM MEMORY — World Cup 2026 Mobile & AI Platform
> **MỤC ĐÍCH**: File này lưu trữ toàn bộ tiến trình phát triển, bugs đã fix, cấu trúc dự án, 
> trạng thái đồng bộ Telegram và những việc cần làm tiếp theo của dự án World Cup 2026.
> 
> **CẬP NHẬT LẦN CUỐI**: 2026-06-17T10:27:00+10:00

---

## 📊 TRẠNG THÁI HIỆN TẠI

| Thành phần | Trạng thái | Ghi chú |
|------------|------------|---------|
| **Vite Compilation** | ✅ HOÀN THÀNH | Đã biên dịch thành công (`npm run build`) |
| **Capacitor Core & CLI** | ✅ HOÀN THÀNH | Đã cài đặt và cấu hình thành công (`capacitor.config.json`) |
| **Capacitor Platforms** | ✅ HOÀN THÀNH | Đã khởi tạo và đồng bộ thành công nền tảng iOS & Android |
| **Giao diện Mobile/Tablet**| ✅ HOÀN THÀNH | Tích hợp responsive (Header, Bottom Tabs, Bento Cards, Split-view tablet) |
| **Tiên tri Heo Hồng AI** | ✅ HOÀN THÀNH | Tích hợp OracleChat.jsx (Gemini + FPT DeepSeek fallback, Glassmorphism UI) |
| **Đồng bộ Telegram** | ✅ HOÀN THÀNH | Sync 2 chiều với Bot `@drthanhto_bot` (Token: `7660859485:...`) |
| **Cược vui & Dự toán AI**| ✅ HOÀN THÀNH | Sửa lỗi cược động Handicap & Over/Under, Dixon-Coles draw correction |

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### 1. Kiến trúc Frontend (React + Vite)
```
[src/main.jsx] -> Khởi chạy ứng dụng
      ↓
[src/App.jsx] -> Trạng thái ứng dụng & Điều phối Layout (Mobile vs Desktop/Tablet)
      ├── [src/components/Navbar.jsx]       -> Thanh điều hướng (Desktop/Tablet)
      ├── [src/components/MatchList.jsx]    -> Danh sách trận đấu & Soi kèo
      ├── [src/components/MatchDetail.jsx]  -> Chi tiết trận đấu & Lịch sử đối đầu
      ├── [src/components/BetSlip.jsx]      -> Phiếu cược giả lập (Xu Heo Vàng)
      ├── [src/components/Standings.jsx]    -> Bảng xếp hạng bảng đấu
      ├── [src/components/NewsHub.jsx]      -> Tin tức & RSS feed
      ├── [src/components/Profile.jsx]      -> Profile người dùng & Lịch sử cược
      └── [src/components/OracleChat.jsx]   -> Trợ lý Tiên tri Heo Hồng (AI)
```

### 2. Dịch vụ và Tiện ích (src/services)
- `api.js`: Đăng ký luồng dữ liệu bóng đá giả lập thời gian thực.
- `worldcup26api.js`: API lấy dữ liệu chi tiết các trận đấu, bảng xếp hạng.
- `gemini.js`: Hàm `generalChatWithHeoHong` (AI Oracle trò chuyện tự do và nhận định kèo).
- `fptDeepseek.js`: API Fallback sang FPT DeepSeek khi Gemini lỗi hoặc hết quota.
- `rss.js`: Tải và parse tin tức bóng đá.

### 3. Đóng gói Di động (Capacitor)
- `capacitor.config.json`: Cấu hình ứng dụng di động (`appId: "com.drto.wc2026"`, `appName: "World Cup 2026"`, `webDir: "dist"`).
- `ios/`: Thư mục dự án native Xcode của iOS.
- `android/`: Thư mục dự án native Gradle của Android.

---

## 🔗 ĐỒNG BỘ TELEGRAM BOT REAL-TIME

Hệ thống đồng bộ hai chiều giữa IDE Agent và Telegram đang hoạt động ổn định:
- **Bot Username**: `@drthanhto_bot` (First Name: `WC2026`)
- **Token**: `7660859485:AAFiyYQF7sh3nSp0dkYNFMo8-31LPyj7RRA`
- **Địa chỉ Script**: `/Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/scripts/telegram_bot.py`
- **Socket Lock**: Port `12005` (Đang chạy ngầm trên PID `40557`)
- **Trạng thái đồng bộ**: Đã liên kết với Conversation ID `cdead85e-cdf0-40a2-9c8f-1bd57f809ee2` (Lưu tại `WC2026/scripts/.telegram_sync.json`).
- **Cách thức hoạt động**:
  - Tin nhắn từ Telegram chuyển thành lệnh `/agent [tin nhắn]` hoặc tin nhắn đồng bộ trực tiếp đưa vào IDE.
  - IDE Agent phản hồi thông qua tệp log `transcript.jsonl` được script đọc và đẩy ngược về Telegram.

---

## 📋 VIỆC CẦN LÀM TIẾP THEO

- [ ] **Kiểm thử giao diện iOS & Android**:
  - Dùng Xcode để mở dự án iOS (`npm run cap:open-ios`) và kiểm tra giao diện trên Simulator.
  - Dùng Android Studio để mở dự án Android (`npm run cap:open-android`) và chạy thử.
- [ ] **Tối ưu hóa hiển thị Tablet**:
  - Đảm bảo dual-pane split view hoạt động mượt mà ở chiều ngang của các dòng iPad và Tablet phổ biến.
- [x] **Bổ sung tính năng nhận định chi tiết**:
  - Cải tiến Prompt trong `gemini.js` để Heo Hồng có thể đọc dữ liệu trận đấu và đưa ra phân tích chuyên sâu hơn (đã tích hợp context lịch thi đấu và BXH thời gian thực).
- [ ] **Kiểm tra và hoàn thiện hệ thống Quà tặng Heo Hồng Labubu**:
  - Thiết kế màn hình nhận quà hoặc kết nối với hệ thống Backend khi người dùng thắng cược vui.

---

## 📁 KEY FILES REFERENCE

| File | Đường dẫn | Vai trò |
|------|-----------|---------|
| `App.jsx` | [App.jsx](file:///Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/src/App.jsx) | Giao diện điều khiển trung tâm & Responsive |
| `OracleChat.jsx` | [OracleChat.jsx](file:///Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/src/components/OracleChat.jsx) | Màn hình trò chuyện với Tiên tri Heo Hồng |
| `gemini.js` | [gemini.js](file:///Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/src/services/gemini.js) | Kết nối AI Model (Gemini/DeepSeek) |
| `package.json` | [package.json](file:///Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/package.json) | Script npm và Dependencies di động |
| `capacitor.config.json` | [capacitor.config.json](file:///Users/tonguyen/Library/CloudStorage/OneDrive-Personal/DrTo/WC2026/capacitor.config.json) | Cấu hình đóng gói Capacitor |
