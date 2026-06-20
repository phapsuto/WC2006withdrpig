# 🏆 World Cup 2026 — Mobile & AI Platform

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Gemini](https://img.shields.io/badge/Gemini-AI--Model-orange?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

Chào mừng bạn đến với **World Cup 2026 AI & Mobile Platform** — Nền tảng di động đa vũ trụ đồng hành cùng giải vô địch bóng đá thế giới World Cup 2026. Ứng dụng kết hợp giao diện Bento Glassmorphic thời thượng, thuật toán AI dự báo xác suất Dixon-Coles, mô hình chat Tiên Tri Heo Hồng, đồng bộ Telegram Bot thời gian thực và cào tin tức mạng xã hội tự động.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 1. 🤖 Thuật Toán Tiên Tri Dixon-Coles & xG (Expected Goals)
- **Dự toán tỷ lệ Poisson hai biến (Bivariate Poisson)**: Sử dụng mô hình Dixon-Coles hiệu chỉnh tỷ lệ hòa giúp tính toán xác suất thắng/hòa/thua chính xác dựa trên điểm ELO hiện tại và lịch sử đối đầu.
- **Bản đồ nhiệt xác suất 5x5**: Hiển thị bảng phân phối xác suất các tỷ số cụ thể (0-0, 1-0, 2-1...) được tô màu hồng theo tỷ lệ cơ hội xuất hiện.
- **Chỉ số xG (Bàn thắng kỳ vọng)**: Tính toán số lượng bàn thắng kỳ vọng dựa trên năng lực ghi bàn/phòng ngự (attack/defense strength) của hai đội, tỷ lệ cược giá trị EV (Expected Value) nổi bật cho người chơi.
- **Form phong độ & Lợi thế co-host**: Hệ thống tự động cộng điểm ELO ảo cho 3 nước chủ nhà (USA, CAN, MEX) và điều chỉnh ELO theo chuỗi phong độ gần nhất.

### 2. 🐷 Trợ Lý Tiên Tri Heo Hồng AI (AI Oracle Mascot)
- **Tương tác trực tiếp**: Trò chuyện đàm đạo bóng đá qua giao diện bong bóng chat Glassmorphism mượt mà.
- **AI Dual-Engine Fallback**: Sử dụng Google Gemini API làm lõi xử lý chính, tự động fallback sang FPT DeepSeek API khi hết quota hoặc gặp sự cố mạng nhằm đảm bảo trải nghiệm không bị gián đoạn.
- **Gợi ý câu hỏi nhanh (Suggestion Chips)**: Nhận định bảng đấu, phân tích cơ hội đi tiếp của Đội tuyển Việt Nam, soi kèo trận HOT... chỉ bằng một lần chạm.

### 3. 💬 Đồng Bộ Telegram Bot 2 Chiều (Real-time Sync)
- **Bot Username**: `@drthanhto_bot` (Token: `7660859485:AAFiyYQF7sh3nSp0dkYNFMo8-31LPyj7RRA`)
- **Đồng bộ hội thoại**: Đồng bộ tin nhắn 2 chiều thời gian thực giữa trợ lý Heo Hồng trong web app và Telegram Chat.
- **Cơ chế khóa cổng (Socket Lock)**: Tự động chạy daemon ngầm trên Port `12005` đảm bảo chỉ có duy nhất một tiến trình Telegram Bot hoạt động, tránh lỗi trùng lặp tin nhắn.

### 4. 📱 Giao Diện Di Động Tối Ưu (Notch & Safe Areas)
- **Chuẩn Native App di động**: Bố cục Bento-grid trực quan, tối ưu hóa các điểm chạm bấm, menu Tab bar trượt mượt mà.
- **Tương thích Tai thỏ (Notch Phones)**: Thiết kế hỗ trợ an toàn cho vùng tai thỏ (`safe-area-inset-top` cho Header) và cạnh dưới (`safe-area-inset-bottom` cho Tab bar cố định).
- **Phiếu cược nổi (Floating Bet Slip FAB)**: Tự động xuất hiện nút nổi phiếu cược góc dưới khi chọn kèo, kích hoạt Bottom Sheet trượt lên đặt cược nhanh chóng từ bất kỳ màn hình nào.

### 5. 📰 Sports News & Social Media Live Scraper
- **Cào tin tự động**: Tự động quét tin tức trước trận đấu 8 tiếng (chu kỳ 10 phút/lần) và cào liên tục từng phút một (chu kỳ 1 phút/lần) khi trận đấu đang diễn ra trực tiếp (LIVE).
- **Bản tin mạng xã hội**: Thu thập các bài đăng nóng hổi, video clip quay bằng điện thoại từ sân vận động trên nền tảng X (Twitter) trong trận đấu và lưu trữ thật trong 7 ngày.
- **Trình điều khiển thông minh**: Tự động kích hoạt luồng cào nhanh ngay khi phát hiện có trận đấu chuyển sang trạng thái LIVE.

### 6. 🎫 Hệ Thống Cược Vui (Golden Pig Coin Bet)
- **Đặt cược ảo**: Hỗ trợ cược Handicap (kèo châu Á), 1x2 (kèo châu Âu) và Over/Under (Tài Xỉu) cập nhật odds trực tiếp theo thời gian thực.
- **Piggy Bank Auto-Refill**: Tự động tặng thêm 10,000 xu Heo Vàng khi số dư của người chơi xuống dưới 10 xu để họ tiếp tục trải nghiệm vui vẻ.

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

### Frontend (React + Vite + Capacitor)
- **Core**: React 19, Vite 8, Lucide React (Icons).
- **Styling**: Vanilla CSS (Hiệu ứng Glassmorphism, Mesh Gradients, Blur-filters, Keyframe Animations).
- **Capacitor SDK**: `@capacitor/core`, `@capacitor/ios`, `@capacitor/android` giúp chuyển đổi nhanh sang ứng dụng native.

### Backend & Automation Scripts (Python)
- **Telegram integration**: `python-telegram-bot`
- **RSS & Scraper**: `feedparser`, `urllib` cào dữ liệu qua Sportmonks API.
- **Database**: Tệp tin lưu trữ thật dạng JSON (`news.json`, `matches_list.json`).

---

## 🚀 Hướng Dẫn Cài Đặt (Installation Guide)

### Bước 1: Clone dự án và cài đặt Node modules
```bash
# Cài đặt các thư viện Node.js cho Frontend
npm install
```

### Bước 2: Cài đặt môi trường Python cho Telegram Bot & Scraper
```bash
# Cài đặt các thư viện Python cần thiết
pip install python-telegram-bot feedparser requests
```

### Bước 3: Cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc và thư mục `scripts/` để cấu hình API Key:
```env
# API Key của Google Gemini
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# API Key dự phòng FPT DeepSeek
VITE_DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY

# API Key lấy dữ liệu bóng đá thực tế Sportmonks
VITE_SPORTMONKS_API_KEY=YOUR_SPORTMONKS_API_KEY
```

---

## 🎯 Hướng Dẫn Khởi Chạy (Running instructions)

### 1. Khởi chạy Vite Dev Server (Frontend)
```bash
# Chạy dự án ở môi trường cục bộ (Port mặc định: 5177)
npm run dev
```

### 2. Khởi chạy Trợ lý Telegram Bot ngầm
```bash
# Chạy Telegram Bot 2 chiều thời gian thực
python scripts/telegram_bot.py
```

### 3. Khởi chạy Trình cào tin tức tự động
```bash
# Chạy scraper cào tin tức bóng đá và mạng xã hội X
python scripts/scrape_news.py
```

---

## 📱 Đóng Gói Ứng Dụng Di Động (Capacitor Mobile Setup)

Ứng dụng đã được tích hợp sẵn cấu trúc đóng gói đa nền tảng. Khi bạn thay đổi code giao diện di động, hãy chạy các lệnh sau để đồng bộ sang điện thoại:

```bash
# 1. Biên dịch production assets và đồng bộ sang thư mục native iOS & Android
npm run cap:sync

# 2. Mở dự án iOS trong Xcode để build/test trên Simulator hoặc máy thật
npm run cap:open-ios

# 3. Mở dự án Android trong Android Studio để build/test trên Android Emulator
npm run cap:open-android
```

---

## 🏗️ Cấu Trúc Dự Án (Folder Structure)

```
WC2026/
├── android/                    # Mã nguồn native Android (Gradle)
├── ios/                       # Mã nguồn native iOS (Xcode)
├── public/                    # Thư mục chứa dữ liệu tĩnh & JSON DB
│   └── data/
│       ├── news.json          # Cơ sở dữ liệu tin tức cào được
│       └── matches_list.json  # Dữ liệu các trận đấu và tỷ lệ kèo
├── scripts/                   # Các script chạy ngầm bằng Python
│   ├── telegram_bot.py        # Mã nguồn điều khiển Bot Telegram
│   └── scrape_news.py         # Mã nguồn cào tin mạng xã hội & RSS
├── src/                       # Mã nguồn React
│   ├── components/            # Các thành phần giao diện (Bento Tiles)
│   │   ├── MatchList.jsx      # Danh sách lịch thi đấu & Kèo cược
│   │   ├── MatchDetail.jsx    # Chi tiết trận đấu & Sa bàn & Dixon-Coles
│   │   ├── Standings.jsx      # Bảng xếp hạng & Danh sách vua phá lưới
│   │   ├── OracleChat.jsx     # Bong bóng trò chuyện Tiên tri Heo Hồng
│   │   └── BetSlip.jsx        # Phiếu cược vui Heo Vàng
│   ├── services/              # Kết nối API (Sportmonks, Gemini, RSS)
│   ├── utils/                 # Thuật toán tính toán AI (Poisson)
│   ├── App.jsx                # Bộ điều phối trung tâm & Responsive layout
│   └── index.css              # Hệ thống phong cách Glassmorphism
└── capacitor.config.json      # File cấu hình Capacitor di động
```

---

## ⚠️ Khuyến Cáo Pháp Lý (Disclaimer)
*Hệ thống cược vui sử dụng **xu Heo Vàng (ảo)** nhằm mục đích giải trí và soi kèo bóng đá lành mạnh bằng AI. Ứng dụng hoàn toàn không hỗ trợ giao dịch, nạp/rút tiền thật dưới mọi hình thức.*

Chúc bạn có những trải nghiệm tuyệt vời cùng mùa giải World Cup 2026 và Tiên Tri Heo Hồng! 🐷⚽🏆
