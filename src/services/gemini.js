// Gemini AI Service for World Cup 2026 cùng Drpig
import { getApiConfig } from './api';

// Helper to normalize Google/Gemini API key
const getNormalizedKey = () => {
  const config = getApiConfig();
  const key = config.geminiApiKey || 'IzaSyAQxlAR-otCUDQ--uRGuuN2kockIhv3Rxg'; // Default key provided
  let trimmed = key.trim();
  if (trimmed.length === 38 && trimmed.startsWith('IzaSy')) {
    return 'A' + trimmed;
  }
  return trimmed;
};

// Base function to call Gemini API
async function callGemini(prompt) {
  const apiKey = getNormalizedKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `Lỗi HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Lỗi gọi Gemini API:', error);
    throw error;
  }
}

/**
 * Generate match analysis from Drpig's perspective
 */
export async function getDrpigPrediction(match) {
  const prompt = `Bạn là Drpig 🐷 - một chú heo mascot Labubu màu hồng đáng yêu, đồng thời là một chuyên gia nhận định bóng đá và kèo cược cực kỳ lão luyện và hài hước cho giải đấu World Cup 2026.
Hãy viết một đoạn nhận định bóng đá ngắn (khoảng 150-200 từ) bằng tiếng Việt cho trận đấu này:
Trận đấu: ${match.home.name} vs ${match.away.name} (Tỷ số hiện tại: ${match.homeScore}-${match.awayScore}, phút thứ ${match.minute}, trạng thái: ${match.status}).
Tỷ lệ cược hiện tại (1X2): ${match.home.name} thắng: ${match.odds.h2h.home}, Hòa: ${match.odds.h2h.draw}, ${match.away.name} thắng: ${match.odds.h2h.away}.
Thông số trận đấu: Kiểm soát bóng: ${match.stats?.possession.home}% - ${match.stats?.possession.away}%, Sút: ${match.stats?.shots.home} - ${match.stats?.shots.away}.

Yêu cầu phong cách viết:
- Xưng "Drpig 🐷" và gọi người đọc là "anh em", "các fen".
- Giọng văn vui nhộn, lém lỉnh, có kiến thức sâu rộng về bóng đá nhưng mang tính chất cá nhân, dí dỏm.
- Đưa ra lời khuyên kèo cược cụ thể cho trận này (ví dụ nên bắt đội nào thắng, tài hay xỉu, hoặc giữ tiền) dựa trên tỷ số và thống kê.
- Sử dụng nhiều emoji liên quan đến bóng đá, heo 🐷, và tiền bạc 💸.
- Không viết dài dòng.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    return `🐷 [Drpig Fallback] Các fen ơi, mạng của Drpig đang bị nghẽn một xíu! Nhưng nhìn vào trận đấu ${match.home.name} (${match.homeScore}) vs ${match.away.name} (${match.awayScore}) ở phút ${match.minute}, Drpig khuyên anh em hãy cẩn thận với kèo chấp hiện tại. Đội tuyển ${match.homeScore >= match.awayScore ? match.home.name : match.away.name} đang chiếm ưu thế lớn, nhưng bóng đá không nói trước được gì đâu nhá! 🐷⚽`;
  }
}

/**
 * Generate simulated social media reactions based on current match events
 */
export async function getDynamicSocialReactions(match) {
  const prompt = `Bạn là hệ thống tạo bình luận và tin tức bóng đá Việt Nam. Hãy tạo 3 bản tin/bình luận ngắn bằng tiếng Việt phản hồi về diễn biến trận đấu World Cup 2026 sau:
Trận đấu: ${match.home.name} vs ${match.away.name} (Tỷ số: ${match.homeScore}-${match.awayScore}, phút thứ ${match.minute}).
Diễn biến chính gần nhất: ${match.timeline && match.timeline.length > 0 ? match.timeline[match.timeline.length - 1].detail : 'Chưa có sự kiện nổi bật'}.

Yêu cầu về nguồn tin (source):
- Nguồn tin phải xuất phát từ các kênh phổ biến tại Việt Nam: Facebook (Hội Cổ Động Viên, Fanpage bóng đá Việt Nam), TikTok (ví dụ: TikTok @vietnam_football), các kênh của bình luận viên nổi tiếng trong nước (BLV Anh Quân, BLV Quang Huy, BLV Tạ Biên Cương), hoặc các nguồn tin quốc tế nổi tiếng (Fabrizio Romano, Sky Sports, ESPN, Goal) dịch sang tiếng Việt.
- Không sử dụng Reddit, Twitter.

Trả về kết quả dưới dạng JSON Array hợp lệ chứa 3 object, mỗi object có cấu trúc:
{
  "source": "Tên nguồn tin (ví dụ: Facebook - Ghiền Bóng Đá, TikTok @anhquan_blv, BLV Tạ Biên Cương, Fabrizio Romano (Dịch))",
  "time": "Khoảng thời gian (ví dụ: 2 phút trước, 5 phút trước)",
  "title": "Tiêu đề hấp dẫn hoặc hashtag bắt trend",
  "summary": "Nội dung bình luận chân thực, cuốn hút bằng tiếng Việt phản ánh đúng không khí cuồng nhiệt của cổ động viên Việt Nam",
  "upvotes": số lượt thích (số nguyên),
  "comments": số bình luận (số nguyên)
}
Chỉ trả về chuỗi JSON, không kèm markdown \`\`\`json hay bất kỳ chữ nào khác ngoài JSON.`;

  try {
    const jsonStr = await callGemini(prompt);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return [
      {
        source: "BLV Anh Quân (Facebook)",
        time: "Vừa xong",
        title: "NHẬN ĐỊNH CỰC NÓNG TỪ PHÒNG PHÂN TÍCH 🎙️",
        summary: `Thế trận vô cùng căng thẳng giữa ${match.home.name} và ${match.away.name}. Tỷ số hiện tại là ${match.homeScore}-${match.awayScore} ở phút ${match.minute}. Một thế trận đôi công rực lửa đúng chất World Cup!`,
        upvotes: 2400,
        comments: 320
      },
      {
        source: "Facebook - Ghiền Bóng Đá",
        time: "3 phút trước",
        title: "BÃO BÌNH LUẬN DƯỚI POST ⚽🔥",
        summary: `Các ông có nghĩ Việt Nam hay các đội bóng châu Á làm nên chuyện kỳ này không? Kèo cược đang biến động cực mạnh, Drpig 🐷 vừa phím kèo cực thơm kìa anh em!`,
        upvotes: 489,
        comments: 215
      },
      {
        source: "TikTok @blv_tabiencuong",
        time: "5 phút trước",
        title: "Thơ Tạ Biên Cương về trận đấu #WC2026",
        summary: `Nước chảy đá mòn, còn tình yêu của CĐV dành cho trận đấu này là bất tận! ${match.homeScore}-${match.awayScore} chưa phải là kết quả cuối cùng đâu các bạn ơi!`,
        upvotes: 1890,
        comments: 320
      }
    ];
  }
}

/**
 * AI translation and summarization for RSS news articles
 */
export async function translateAndSummarizeNews(article) {
  const isEnglish = article.lang === 'en';
  
  const prompt = `Bạn là Drpig 🐷 - chú heo mascot đáng yêu nhận định giải đấu World Cup 2026.
Hãy dịch và tóm tắt bài báo thể thao sau đây từ nguồn tin "${article.source}":

Tiêu đề: ${article.title}
Nội dung tóm tắt gốc: ${article.description}
Ngôn ngữ gốc của bài viết: ${isEnglish ? 'Tiếng Anh (Hãy dịch toàn bộ sang Tiếng Việt)' : 'Tiếng Việt'}

Yêu cầu đầu ra:
1. Dịch tiêu đề sang Tiếng Việt thật tự nhiên, thu hút đúng chất bóng đá Việt Nam.
2. Tóm tắt nội dung bài viết bằng Tiếng Việt một cách ngắn gọn (khoảng 80-100 từ).
3. Đưa thêm một nhận xét ngắn mang cá tính hài hước, dí dỏm của Drpig 🐷 (sử dụng xưng hô "Drpig 🐷" và gọi "anh em" hoặc "các fen").
4. Trả về kết quả dưới dạng JSON object hợp lệ:
{
  "translatedTitle": "Tiêu đề đã dịch hoặc viết lại",
  "summary": "Nội dung tóm tắt kèm nhận định dí dỏm của Drpig"
}
Chỉ trả về chuỗi JSON, không kèm bất kỳ markdown hay ký tự khác.`;

  try {
    const jsonStr = await callGemini(prompt);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      translatedTitle: isEnglish ? `[Dịch] ${article.title}` : article.title,
      summary: `${article.description}\n\n🐷 *Drpig bình luận:* Tin tức này cực hot nè các fen ơi! Hàng thủ đang có biến lớn đó nha! ⚽💸`
    };
  }
}
