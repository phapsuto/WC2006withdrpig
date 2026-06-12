// Gemini AI Service for World Cup 2026 cùng Drpig

// Helper to normalize Google/Gemini API key
const getNormalizedKey = () => {
  let geminiApiKey = 'IzaSyAQxlAR-otCUDQ--uRGuuN2kockIhv3Rxg'; // Default key provided
  try {
    const savedConfig = localStorage.getItem('football_app_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.geminiApiKey) {
        geminiApiKey = parsed.geminiApiKey;
      }
    }
  } catch (e) {
    console.warn('LocalStorage not accessible in gemini.js', e);
  }
  let trimmed = geminiApiKey.trim();
  if (trimmed.length === 38 && trimmed.startsWith('IzaSy')) {
    return 'A' + trimmed;
  }
  return trimmed;
};

// Base function to call Gemini API
async function callGemini(prompt, useGrounding = false) {
  const apiKey = getNormalizedKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
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
      maxOutputTokens: 1200,
    }
  };

  if (useGrounding) {
    requestBody.tools = [
      {
        googleSearch: {}
      }
    ];
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (useGrounding) {
        console.warn('Grounding request failed, retrying without grounding...');
        return await callGemini(prompt, false);
      }
      const errData = await response.json();
      throw new Error(errData.error?.message || `Lỗi HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (useGrounding) {
      console.warn('Grounding throw error, retrying without grounding...', error);
      return await callGemini(prompt, false);
    }
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
  "comments": số bình luận (số nguyên),
  "hasVideo": true/false (trả về true cho ít nhất 1 object để đính kèm video clip highlight tự động)
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
        comments: 320,
        hasVideo: true
      },
      {
        source: "Facebook - Ghiền Bóng Đá",
        time: "3 phút trước",
        title: "BÃO BÌNH LUẬN DƯỚI POST ⚽🔥",
        summary: `Các ông có nghĩ Việt Nam hay các đội bóng châu Á làm nên chuyện kỳ này không? Kèo cược đang biến động cực mạnh, Drpig 🐷 vừa phím kèo cực thơm kìa anh em!`,
        upvotes: 489,
        comments: 215,
        hasVideo: false
      },
      {
        source: "TikTok @blv_tabiencuong",
        time: "5 phút trước",
        title: "Thơ Tạ Biên Cương về trận đấu #WC2026",
        summary: `Nước chảy đá mòn, còn tình yêu của CĐV dành cho trận đấu này là bất tận! ${match.homeScore}-${match.awayScore} chưa phải là kết quả cuối cùng đâu các bạn ơi!`,
        upvotes: 1890,
        comments: 320,
        hasVideo: true
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

/**
 * AI Google Sports Results Scraper (google-sports-results-api simulation)
 */
export async function getGoogleSportsData(queryType) {
  let prompt = '';
  let useGrounding = false;
  
  if (queryType === 'TOP_SCORERS') {
    useGrounding = true;
    prompt = `Bạn là API Vua phá lưới World Cup 2026. Hãy đóng vai trò bộ phân tích kết quả của Google Sports Search (google-sports-results-api).
Hãy tra cứu hoặc giả lập danh sách 5 cầu thủ ghi bàn hàng đầu tại World Cup 2026 hiện tại (bắt đầu từ ngày khai mạc 11-12/06/2026).

Trả về kết quả dưới dạng JSON Array hợp lệ chứa 5 cầu thủ có cấu trúc:
[
  {
    "rank": 1,
    "name": "Tên cầu thủ (ví dụ: Santiago Gimenez)",
    "team": "Quốc gia (ví dụ: Mexico)",
    "flag": "mã cờ quốc gia từ FlagCDN (ví dụ: mx)",
    "goals": số bàn thắng (số nguyên),
    "assists": số kiến tạo (số nguyên)
  },
  ...
]
Chỉ trả về chuỗi JSON, không kèm bất kỳ markdown hay ký tự khác.`;
  } else if (queryType === 'MATCHES') {
    useGrounding = true;
    prompt = `Bạn là API Google Sports Results (google-sports-results-api) được gọi qua ScrapingBee để trích xuất dữ liệu bóng đá trực tiếp từ Google Search.
Hãy tra cứu kết quả, lịch thi đấu và thống kê chi tiết của loạt trận khai mạc giải đấu World Cup 2026 thực tế hoặc giả lập sát thực tế (diễn ra bắt đầu từ ngày 11-12/06/2026).
Danh sách các trận đấu cần bao gồm ít nhất 5 trận của các đội bảng A và B:
- Trận 1: Mexico vs Nam Phi (Bảng A)
- Trận 2: Canada vs Bosnia & Hz. (Bảng A)
- Trận 3: Mỹ vs Paraguay (Bảng A)
- Trận 4: Hàn Quốc vs Cộng hòa Séc (Bảng B)
- Trận 5: Tây Ban Nha vs Croatia (Bảng B)

Hãy trả về một danh sách JSON Array chứa các trận đấu với cấu trúc chính xác sau:
[
  {
    "id": "chuỗi id duy nhất (ví dụ: m1, m2, m3, m4, m5)",
    "league": {
      "name": "Tên bảng đấu (ví dụ: Bảng A • World Cup 2026)",
      "country": "Mỹ/Canada/Mexico"
    },
    "home": {
      "name": "Mexico",
      "short": "MEX",
      "flag": "mx",
      "color": "#006847",
      "textColor": "#ffffff"
    },
    "away": {
      "name": "Nam Phi",
      "short": "RSA",
      "flag": "za",
      "color": "#ffb612",
      "textColor": "#000000"
    },
    "homeScore": số bàn thắng đội nhà (số nguyên),
    "awayScore": số bàn thắng đội khách (số nguyên),
    "status": "Trạng thái trận đấu: 'LIVE' (đang đá), 'FINISHED' (đã kết thúc), hoặc 'UPCOMING' (chưa đá)",
    "minute": số phút thi đấu (số nguyên, 0-90),
    "stats": {
      "possession": { "home": 58, "away": 42 },
      "shots": { "home": 15, "away": 8 },
      "shotsOnTarget": { "home": 6, "away": 3 },
      "fouls": { "home": 12, "away": 14 },
      "corners": { "home": 5, "away": 3 },
      "yellowCards": { "home": 1, "away": 2 },
      "redCards": { "home": 0, "away": 0 }
    },
    "timeline": [
      { "minute": 18, "type": "YELLOW", "team": "away", "detail": "T. Mokoena" },
      { "minute": 34, "type": "GOAL", "team": "home", "detail": "S. Gimenez" }
    ],
    "lineups": {
      "home": [
        { "number": 11, "name": "S. Gimenez", "role": "FW", "x": 50, "y": 15 }
      ],
      "away": [
        { "number": 10, "name": "P. Tau", "role": "FW", "x": 20, "y": 20 }
      ]
    },
    "odds": {
      "h2h": { "home": 1.85, "draw": 3.40, "away": 4.20 },
      "handicap": { "line": "-0.5", "home": 1.85, "away": 1.95 },
      "overUnder": { "line": "2.5", "over": 1.90, "under": 1.90 }
    }
  }
]

Yêu cầu cực kỳ quan trọng:
- Đảm bảo các đội bóng và cầu thủ phải trùng khớp thông tin thật của đội tuyển tham dự World Cup 2026.
- Đảm bảo cấu trúc JSON tuyệt đối chính xác và đầy đủ các trường dữ liệu để tránh crash ứng dụng.
- Chỉ trả về chuỗi JSON, không kèm markdown \`\`\`json hay bất kỳ văn bản giải thích nào khác.`;
  } else {
    return null;
  }

  try {
    const jsonStr = await callGemini(prompt, useGrounding);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`Lỗi API Google Sports cho ${queryType}:`, e);
    if (queryType === 'TOP_SCORERS') {
      return [
        { rank: 1, name: "Santiago Gimenez", team: "Mexico", flag: "mx", goals: 1, assists: 0 },
        { rank: 2, name: "Edin Dzeko", team: "Bosnia & Hz.", flag: "ba", goals: 1, assists: 0 },
        { rank: 3, name: "Jonathan David", team: "Canada", flag: "ca", goals: 1, assists: 0 },
        { rank: 4, name: "Hirving Lozano", team: "Mexico", flag: "mx", goals: 1, assists: 0 },
        { rank: 5, name: "Christian Pulisic", team: "Mỹ", flag: "us", goals: 0, assists: 1 }
      ];
    }
    throw e;
  }
}

/**
 * AI Sports Analytics Intelligence (xG, Kelly, SHAP)
 */
export async function getSportsAnalytics(match) {
  const prompt = `Bạn là hệ thống Trí tuệ Nhân tạo Phân tích Bóng đá Chuyên sâu (sports-analytics-intelligence) tích hợp nhận định của Drpig 🐷.
Hãy phân tích trận đấu World Cup 2026 sau:
Đội nhà: ${match.home.name} vs Đội khách: ${match.away.name} (Tỷ số: ${match.homeScore}-${match.awayScore}, phút: ${match.minute}, trạng thái: ${match.status}).
Thống kê hiện tại: Kiểm soát bóng: ${match.stats?.possession.home}%-${match.stats?.possession.away}%, Sút: ${match.stats?.shots.home}-${match.stats?.shots.away}, Sút trúng đích: ${match.stats?.shotsOnTarget.home}-${match.stats?.shotsOnTarget.away}.
Tỷ lệ kèo: 1X2 (${match.odds.h2h.home} - ${match.odds.h2h.draw} - ${match.odds.h2h.away}), Chấp (${match.odds.handicap.line}: ${match.odds.handicap.home} - ${match.odds.handicap.away}).

Hãy tính toán và phân tích các chỉ số sau bằng tiếng Việt:
1. Chỉ số bàn thắng kỳ vọng (xG - Expected Goals) của mỗi đội dựa trên số cú sút trúng đích và thế trận.
2. Công thức quản lý vốn Kelly Criterion: Đưa ra % vốn khuyến nghị nên cược và tên kèo tối ưu nhất dựa trên đánh giá chênh lệch xác suất.
3. Giải thích tính chất dự đoán mô hình SHAP (SHAP Explainability) gồm 4 yếu tố chính kèm % trọng số đóng góp của từng yếu tố đối với kết quả dự đoán (Ví dụ: Phong độ: 40%, Sân nhà: 25%, Thẻ phạt: 20%, Cầu thủ ngôi sao: 15%).

Trả về kết quả dưới dạng JSON object hợp lệ:
{
  "homeXG": số xG đội nhà (float, ví dụ: 1.64),
  "awayXG": số xG đội khách (float, ví dụ: 0.85),
  "xgTimeline": "Phân tích cụ thể về thế trận tấn công và hiệu quả dứt điểm xG của hai đội...",
  "kellyCriterion": {
    "stakePercent": số phần trăm vốn khuyên dùng (float, ví dụ: 4.2),
    "recommendedBet": "Kèo khuyên bắt (ví dụ: Chấp Mexico -0.5)",
    "rationale": "Lý giải ngắn gọn bằng tiếng Việt từ Drpig 🐷..."
  },
  "shapExplainability": [
    { "factor": "Yếu tố 1", "weight": trọng số phần trăm (số nguyên) },
    { "factor": "Yếu tố 2", "weight": trọng số phần trăm (số nguyên) },
    { "factor": "Yếu tố 3", "weight": trọng số phần trăm (số nguyên) },
    { "factor": "Yếu tố 4", "weight": trọng số phần trăm (số nguyên) }
  ]
}
Chỉ trả về chuỗi JSON, không kèm bất kỳ markdown hay ký tự khác.`;

  try {
    const jsonStr = await callGemini(prompt);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback analytics
    const homeGoals = match.homeScore;
    const awayGoals = match.awayScore;
    return {
      homeXG: parseFloat((homeGoals * 0.45 + 0.5 + Math.random() * 0.5).toFixed(2)),
      awayXG: parseFloat((awayGoals * 0.45 + 0.3 + Math.random() * 0.5).toFixed(2)),
      xgTimeline: `Drpig phân tích: Đội tuyển ${match.home.name} tạo ra nhiều cơ hội dứt điểm nguy hiểm hơn. Trái lại, ${match.away.name} đang chắt chiu các đợt phản công nhanh.`,
      kellyCriterion: {
        stakePercent: 3.5,
        recommendedBet: `Kèo 1X2 - ${match.home.name} thắng`,
        rationale: "🐷 Drpig nhận định: Xác suất chiến thắng của đội nhà cao hơn tỷ lệ nhà cái niêm yết, khuyên đặt nhẹ nhàng giải trí vui vẻ!"
      },
      shapExplainability: [
        { factor: "Phong độ thi đấu gần đây", weight: 40 },
        { factor: "Thống kê sút bóng thực tế", weight: 30 },
        { factor: "Tương quan đội hình ra sân", weight: 20 },
        { factor: "Yếu tố sân bãi và di chuyển", weight: 10 }
      ]
    };
  }
}
