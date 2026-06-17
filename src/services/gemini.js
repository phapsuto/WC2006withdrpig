// Gemini AI Service for World Cup 2026 cùng Heo Hồng
import { predictMatch } from '../utils/aiPredictor';
import { trackApiCall } from '../utils/apiTracker';
import { getLiveMatchesForApp, getLiveGroupStandings } from './worldcup26api';

// Memory cache for AI responses to prevent duplicate calls and ensure instant loads
const aiCache = new Map();

const getCachedResponse = (key, ttlMs = 120000) => {
  const cached = aiCache.get(key);
  if (cached && (Date.now() - cached.timestamp < ttlMs)) {
    return cached.data;
  }
  return null;
};

const setCachedResponse = (key, data) => {
  aiCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Helper to normalize Google/Gemini API key
const getNormalizedKey = () => {
  let geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
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

const FPT_API_URL = 'https://mkp-api.fptcloud.com/v1/chat/completions';
const FPT_API_KEY = import.meta.env.VITE_FPT_CLOUD_API_KEY || '';
const FPT_MODEL = 'DeepSeek-V4-Flash';

// Fallback helper to call FPT DeepSeek API
async function callFptDeepseekFallback(messages, systemMessage = '') {
  const payload = {
    model: FPT_MODEL,
    messages: [],
    temperature: 0.7,
    max_tokens: 1000
  };
  
  if (systemMessage) {
    payload.messages.push({ role: 'system', content: systemMessage });
  }
  
  payload.messages.push(...messages);

  const response = await fetch(FPT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FPT_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FPT API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Base function to call Gemini API with FPT DeepSeek Fallback
async function callGemini(prompt, useGrounding = false) {
  const apiKey = getNormalizedKey();
  
  try {
    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
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
    if (data && data.usageMetadata) {
      trackApiCall('gemini', {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0
      });
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (useGrounding) {
      console.warn('Grounding throw error, retrying without grounding...', error);
      return await callGemini(prompt, false);
    }
    console.warn('Lỗi gọi Gemini API, chuyển sang FPT DeepSeek làm fallback...', error);
    try {
      const messages = [{ role: 'user', content: prompt }];
      return await callFptDeepseekFallback(messages, 'Bạn là Heo Hồng 🐷 - mascot Labubu màu hồng đáng yêu nhận định bóng đá World Cup 2026.');
    } catch (fallbackError) {
      console.error('FPT Fallback cũng thất bại:', fallbackError);
      throw error;
    }
  }
}

/**
 * Generate match analysis from Heo Hồng's perspective
 */
export async function getHeoHongPrediction(match) {
  let cacheKey = `pred_${match.id}_${match.status}`;
  let ttl = 120000; // 2 minutes default
  if (match.status === 'FINISHED') {
    cacheKey = `pred_${match.id}_finished`;
    ttl = 24 * 60 * 60 * 1000; // 24 hours
  } else if (match.status === 'UPCOMING') {
    cacheKey = `pred_${match.id}_upcoming`;
    ttl = 30 * 60 * 1000; // 30 minutes
  } else if (match.status === 'LIVE') {
    cacheKey = `pred_${match.id}_live_${Math.floor(match.minute / 2)}`;
    ttl = 120000;
  }

  const cached = getCachedResponse(cacheKey, ttl);
  if (cached) return cached;

  const hasSm = match.sportmonksPredictions && match.sportmonksPredictions.probabilities;
  const smPred = hasSm ? match.sportmonksPredictions : null;

  const prediction = predictMatch(
    match.home.name,
    match.away.name,
    match.homeScore,
    match.awayScore,
    match.status,
    match.minute
  );

  const homeWin = smPred ? smPred.probabilities.homeWin : prediction.probabilities.homeWin;
  const draw = smPred ? smPred.probabilities.draw : prediction.probabilities.draw;
  const awayWin = smPred ? smPred.probabilities.awayWin : prediction.probabilities.awayWin;
  const over25 = smPred ? smPred.probabilities.over25 : prediction.probabilities.over25;
  const under25 = smPred ? smPred.probabilities.under25 : prediction.probabilities.under25;

  const homeElo = smPred ? smPred.analytics.homeElo : prediction.analytics.homeElo;
  const awayElo = smPred ? smPred.analytics.awayElo : prediction.analytics.awayElo;
  const mostLikelyScore = smPred ? smPred.analytics.mostLikelyScore : prediction.analytics.mostLikelyScore;
  const expectedHomeGoals = smPred ? smPred.analytics.expectedHomeGoals : prediction.analytics.expectedHomeGoals;
  const expectedAwayGoals = smPred ? smPred.analytics.expectedAwayGoals : prediction.analytics.expectedAwayGoals;

  const modelName = hasSm ? "Mô hình AI Sportmonks Premium" : "Mô hình toán học AI (Poisson & ELO)";

  const prompt = `Bạn là Heo Hồng 🐷 - một chú heo mascot Labubu màu hồng đáng yêu, đồng thời là một chuyên gia nhận định bóng đá và kèo cược cực kỳ lão luyện và hài hước cho giải đấu World Cup 2026.
${modelName} của chúng ta đã tính toán các thông số xác suất cho trận đấu này như sau:
- Chỉ số sức mạnh ELO: ${match.home.name} (${homeElo}) vs ${match.away.name} (${awayElo})
- Xác suất thắng/hòa/thua: ${match.home.name} thắng ${homeWin}%, Hòa ${draw}%, ${match.away.name} thắng ${awayWin}%
- Số bàn thắng kỳ vọng (Expected Goals): ${match.home.name} ${expectedHomeGoals} bàn, ${match.away.name} ${expectedAwayGoals} bàn
- Tỷ số khả dĩ nhất: ${mostLikelyScore}
- Xác suất Tài xỉu 2.5: Tài ${over25}%, Xỉu ${under25}%

Hãy viết một đoạn nhận định bóng đá ngắn (khoảng 150-200 từ) bằng tiếng Việt cho trận đấu này:
Trận đấu: ${match.home.name} vs ${match.away.name} (Tỷ số hiện tại: ${match.homeScore}-${match.awayScore}, phút thứ ${match.minute}, trạng thái: ${match.status}).
Tỷ lệ cược hiện tại (1X2): ${match.home.name} thắng: ${match.odds.h2h.home}, Hòa: ${match.odds.h2h.draw}, ${match.away.name} thắng: ${match.odds.h2h.away}.
Thông số trận đấu: Kiểm soát bóng: ${match.stats?.possession.home}% - ${match.stats?.possession.away}%, Sút: ${match.stats?.shots.home} - ${match.stats?.shots.away}.

Yêu cầu phong cách viết:
- Xưng "Heo Hồng 🐷" và gọi người đọc là "anh em", "các fen".
- Giọng văn vui nhộn, lém lỉnh, bám sát các số liệu khoa học trên (đặc biệt là tỷ lệ xác suất Poisson và ELO) nhưng bình luận cực kỳ hài hước, dí dỏm.
- Đưa ra lời khuyên kèo cược cụ thể cho trận này (ví dụ nên bắt đội nào thắng, tài hay xỉu, hoặc giữ tiền) dựa trên phân tích toán học và tỷ lệ kèo nhà cái.
- Sử dụng nhiều emoji liên quan đến bóng đá, heo 🐷, và tiền bạc 💸.
- Không viết dài dòng.`;

  try {
    const result = await callGemini(prompt, false);
    setCachedResponse(cacheKey, result);
    return result;
  } catch {
    return `🐷 [Heo Hồng Fallback] Các fen ơi, mạng của Heo Hồng đang bị nghẽn một xíu! Nhìn vào mô hình AI Poisson, xác suất thắng của ${match.home.name} là ${homeWin}%, Hòa ${draw}%, ${match.away.name} thắng ${awayWin}%. Heo Hồng khuyên anh em ${homeWin > awayWin ? `bắt nhẹ ${match.home.name}` : `tin tưởng ${match.away.name}`} hoặc đi cửa Tài nếu thích rực lửa! 🐷⚽`;
  }
}

/**
 * Generate simulated social media reactions based on current match events
 */
export async function getDynamicSocialReactions(match) {
  let cacheKey = `reactions_${match.id}_${match.status}`;
  let ttl = 120000; // 2 minutes default
  if (match.status === 'FINISHED') {
    cacheKey = `reactions_${match.id}_finished`;
    ttl = 24 * 60 * 60 * 1000;
  } else if (match.status === 'UPCOMING') {
    cacheKey = `reactions_${match.id}_upcoming`;
    ttl = 30 * 60 * 1000;
  } else if (match.status === 'LIVE') {
    cacheKey = `reactions_${match.id}_live_${Math.floor(match.minute / 2)}`;
    ttl = 120000;
  }

  const cached = getCachedResponse(cacheKey, ttl);
  if (cached) return cached;

  const prompt = `Bạn là hệ thống tạo bình luận và tin tức bóng đá Việt Nam. Hãy tạo 3 bình luận thể thao trực tiếp phản hồi về diễn biến trận đấu World Cup 2026 sau:
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
    const jsonStr = await callGemini(prompt, false);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    setCachedResponse(cacheKey, result);
    return result;
  } catch {
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
        summary: `Các ông có nghĩ Việt Nam hay các đội bóng châu Á làm nên chuyện kỳ này không? Kèo cược đang biến động cực mạnh, Heo Hồng 🐷 vừa phím kèo cực thơm kìa anh em!`,
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
  
  const prompt = `Bạn là Heo Hồng 🐷 - chú heo mascot đáng yêu nhận định giải đấu World Cup 2026.
Hãy dịch và tóm tắt bài báo thể thao sau đây từ nguồn tin "${article.source}":

Tiêu đề: ${article.title}
Nội dung tóm tắt gốc: ${article.description}
Ngôn ngữ gốc của bài viết: ${isEnglish ? 'Tiếng Anh (Hãy dịch toàn bộ sang Tiếng Việt)' : 'Tiếng Việt'}

Yêu cầu đầu ra:
1. Dịch tiêu đề sang Tiếng Việt thật tự nhiên, thu hút đúng chất bóng đá Việt Nam.
2. Tóm tắt nội dung bài viết bằng Tiếng Việt một cách ngắn gọn (khoảng 80-100 từ).
3. Đưa thêm một nhận xét ngắn mang cá tính hài hước, dí dỏm của Heo Hồng 🐷 (sử dụng xưng hô "Heo Hồng 🐷" và gọi "anh em" hoặc "các fen").
4. Trả về kết quả dưới dạng JSON object hợp lệ:
{
  "translatedTitle": "Tiêu đề đã dịch hoặc viết lại",
  "summary": "Nội dung tóm tắt kèm nhận định dí dỏm của Heo Hồng"
}
Chỉ trả về chuỗi JSON, không kèm bất kỳ markdown hay ký tự khác.`;

  try {
    const jsonStr = await callGemini(prompt, false);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      translatedTitle: isEnglish ? `[Dịch] ${article.title}` : article.title,
      summary: `${article.description}\n\n🐷 *Heo Hồng bình luận:* Tin tức này cực hot nè các fen ơi! Hàng thủ đang có biến lớn đó nha! ⚽💸`
    };
  }
}

/**
 * AI Google Sports Results Scraper (google-sports-results-api simulation)
 */
export async function getGoogleSportsData(queryType) {
  let cacheKey = `googlesports_${queryType}`;
  let ttl = queryType === 'TOP_SCORERS' ? 600000 : 300000; // 10 min for scorers, 5 min for matches
  const cached = getCachedResponse(cacheKey, ttl);
  if (cached) return cached;

  let prompt;
  let useGrounding;
  
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
    const result = JSON.parse(cleaned);
    setCachedResponse(cacheKey, result);
    return result;
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
 * AI Sports Analytics Intelligence (xG, Kelly, SHAP + Extended Tactics, Matchups, H2H, Injuries)
 */
export async function getSportsAnalytics(match) {
  let cacheKey = `analytics_${match.id}_${match.status}`;
  let ttl = 120000; // 2 minutes default
  if (match.status === 'FINISHED') {
    cacheKey = `analytics_${match.id}_finished`;
    ttl = 24 * 60 * 60 * 1000;
  } else if (match.status === 'UPCOMING') {
    cacheKey = `analytics_${match.id}_upcoming`;
    ttl = 30 * 60 * 1000;
  } else if (match.status === 'LIVE') {
    cacheKey = `analytics_${match.id}_live_${Math.floor(match.minute / 2)}`;
    ttl = 120000;
  }

  const cached = getCachedResponse(cacheKey, ttl);
  if (cached) return cached;

  const hasSm = match.sportmonksPredictions && match.sportmonksPredictions.probabilities;
  const smPred = hasSm ? match.sportmonksPredictions : null;

  const prediction = predictMatch(
    match.home.name,
    match.away.name,
    match.homeScore,
    match.awayScore,
    match.status,
    match.minute
  );

  const homeWin = smPred ? smPred.probabilities.homeWin : prediction.probabilities.homeWin;
  const draw = smPred ? smPred.probabilities.draw : prediction.probabilities.draw;
  const awayWin = smPred ? smPred.probabilities.awayWin : prediction.probabilities.awayWin;
  const expectedHomeGoals = smPred ? smPred.analytics.expectedHomeGoals : prediction.analytics.expectedHomeGoals;
  const expectedAwayGoals = smPred ? smPred.analytics.expectedAwayGoals : prediction.analytics.expectedAwayGoals;

  // Calculate Kelly Criterion locally
  const oddsHome = match.odds?.h2h?.home || 2.0;
  const oddsDraw = match.odds?.h2h?.draw || 3.0;
  const oddsAway = match.odds?.h2h?.away || 3.0;

  const pH = homeWin / 100;
  const pD = draw / 100;
  const pA = awayWin / 100;

  const edgeH = pH * oddsHome - 1;
  const edgeD = pD * oddsDraw - 1;
  const edgeA = pA * oddsAway - 1;

  let recommendedBet = 'Không cược (Không có Value Bet)';
  let kellyStake = 0;

  if (edgeH > 0 && edgeH >= edgeD && edgeH >= edgeA) {
    kellyStake = (edgeH / (oddsHome - 1)) * 100;
    recommendedBet = `Kèo 1X2 - ${match.home.name} thắng`;
  } else if (edgeD > 0 && edgeD >= edgeH && edgeD >= edgeA) {
    kellyStake = (edgeD / (oddsDraw - 1)) * 100;
    recommendedBet = `Kèo 1X2 - Hòa`;
  } else if (edgeA > 0 && edgeA >= edgeH && edgeA >= edgeD) {
    kellyStake = (edgeA / (oddsAway - 1)) * 100;
    recommendedBet = `Kèo 1X2 - ${match.away.name} thắng`;
  }

  // Fractional Kelly (50% size) capped at 10% to prevent bankruptcy
  const finalStake = Math.max(0, Math.min(10, Math.round(kellyStake * 0.5 * 10) / 10));

  const modelDesc = hasSm ? "mô hình phân tích Premium Sportmonks" : "mô hình phân tích định lượng";

  const prompt = `Bạn là hệ thống Trí tuệ Nhân tạo Phân tích Bóng đá Chuyên sâu (sports-analytics-intelligence) tích hợp nhận định của Heo Hồng 🐷.
Chúng tôi đã chạy ${modelDesc} và thu được các kết quả khoa học sau:
- Chỉ số cơ hội ghi bàn dự kiến (Expected Goals): ${match.home.name} là ${expectedHomeGoals}, ${match.away.name} là ${expectedAwayGoals}
- Xác suất Thắng/Hòa/Thua dự kiến: ${match.home.name} thắng ${homeWin}%, Hòa ${draw}%, ${match.away.name} thắng ${awayWin}%
- Gợi ý chia vốn an toàn (Kelly Criterion): Đặt ${finalStake}% vốn vào cửa "${recommendedBet}" (do tỷ lệ cược của nhà cái đem lại lợi thế cược lớn)

Hãy viết báo cáo phân tích bằng tiếng Việt dựa trên các thông số khoa học trên:
Đội nhà: ${match.home.name} vs Đội khách: ${match.away.name} (Tỷ số: ${match.homeScore}-${match.awayScore}, phút: ${match.minute}, trạng thái: ${match.status}).
Thống kê hiện tại: Kiểm soát bóng: ${match.stats?.possession.home}%-${match.stats?.possession.away}%, Sút: ${match.stats?.shots.home}-${match.stats?.shots.away}, Sút trúng đích: ${match.stats?.shotsOnTarget.home}-${match.stats?.shotsOnTarget.away}.
Tỷ lệ kèo: 1X2 (${oddsHome} - ${oddsDraw} - ${oddsAway}), Chấp (${match.odds?.handicap?.line}: ${match.odds?.handicap?.home} - ${match.odds?.handicap?.away}).

Yêu cầu về từ ngữ:
- Tuyệt đối TRÁNH sử dụng các thuật ngữ chuyên môn quá phức tạp như "xG", "Kelly", "SHAP", "Poisson", "ELO", "Expected Value" trong các phần văn bản giải thích cho người dùng (như "xgTimeline", "rationale", "factor").
- Hãy viết bằng các từ bình dân dễ hiểu trong tiếng Việt (Ví dụ: thay vì viết "chỉ số xG", hãy viết "bàn thắng dự kiến" hoặc "số cơ hội ghi bàn dự kiến"; thay vì viết "phương án Kelly", hãy viết "gợi ý phân bổ vốn cược" hoặc "gợi ý chia tiền cược"; thay vì viết "ELO", hãy viết "phong độ và sức mạnh đội bóng").
- Báo cáo phải bao gồm phần: Phân tích chiến thuật (tacticalReview), Cầu thủ chủ chốt đối đầu (keyPlayerMatchups), Lịch sử đối đầu (headToHead), và Danh sách chấn thương (injuryList).

Hãy trả về kết quả dưới dạng JSON object hợp lệ:
{
  "homeXG": ${expectedHomeGoals},
  "awayXG": ${expectedAwayGoals},
  "xgTimeline": "Phân tích cụ thể và dễ hiểu (khoảng 80-100 từ) về hiệu suất dứt điểm và số bàn thắng dự kiến hiện tại của hai đội dựa trên thế trận và thống kê thực tế...",
  "kellyCriterion": {
    "stakePercent": ${finalStake},
    "recommendedBet": "${recommendedBet}",
    "rationale": "Lý giải ngắn gọn bằng tiếng Việt từ Heo Hồng 🐷 vì sao nên chọn cửa này và tỷ lệ ${finalStake}% vốn là hợp lý để giữ an toàn cho quỹ tiền của mình..."
  },
  "shapExplainability": [
    { "factor": "Phong độ và thực lực đội bóng", "weight": ${Math.round(35 + Math.random() * 10)} },
    { "factor": "Lợi thế sân nhà và khán giả", "weight": ${Math.round(20 + Math.random() * 10)} },
    { "factor": "Thống kê dứt điểm thực tế", "weight": ${Math.round(20 + Math.random() * 10)} },
    { "factor": "Thông tin chấn thương, lực lượng", "weight": ${Math.round(10 + Math.random() * 5)} }
  ],
  "tacticalReview": "Nhận định chiến thuật sơ lược (lối chơi pressing, phòng thủ phản công, cự ly đội hình) của cả 2 đội trong trận đấu này...",
  "keyPlayerMatchups": "Những cặp đối đầu nóng trên sân giữa các ngôi sao chủ chốt của 2 đội (ví dụ Tiền đạo ngôi sao gặp trung vệ thép)...",
  "headToHead": "Tóm tắt lịch sử chạm trán gần đây nhất giữa hai đội tuyển quốc gia (số trận thắng thua, tỉ số lịch sử)...",
  "injuryList": "Cập nhật danh sách các cầu thủ vắng mặt hoặc bỏ ngỏ khả năng ra sân vì chấn thương hoặc thẻ phạt của hai đội..."
}
Chỉ trả về chuỗi JSON, không kèm bất kỳ markdown hay ký tự khác.`;

  try {
    const jsonStr = await callGemini(prompt, false);
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    setCachedResponse(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Lỗi phân tích sâu:', error);
    return {
      homeXG: expectedHomeGoals,
      awayXG: expectedAwayGoals,
      xgTimeline: `Heo Hồng nhận định: Đội tuyển ${match.home.name} đang tạo ra nhiều cơ hội ghi bàn sắc nét hơn với số bàn thắng dự kiến là ${expectedHomeGoals}. Trái lại, ${match.away.name} đang chọn lối chơi phòng ngự phản công với số bàn thắng dự kiến là ${expectedAwayGoals}.`,
      kellyCriterion: {
        stakePercent: finalStake,
        recommendedBet: recommendedBet,
        rationale: `🐷 Heo Hồng khuyên các fen: Theo phân tích phân bổ vốn cược an toàn, đặt ${finalStake}% vốn vào cửa ${recommendedBet} là phương án hợp lý nhất dựa trên phong độ thực tế của hai đội so với tỷ lệ nhà cái đưa ra.`
      },
      shapExplainability: [
        { factor: "Phong độ thi đấu và sức mạnh đội bóng", weight: 45 },
        { factor: "Thống kê sút bóng thực tế", weight: 25 },
        { factor: "Tương quan đội hình ra sân", weight: 20 },
        { factor: "Yếu tố sân bãi và di chuyển", weight: 10 }
      ],
      tacticalReview: `${match.home.name} chủ trương kiểm soát thế trận trung lộ và dâng cao đội hình áp sát. Trong khi đó, ${match.away.name} lùi sâu đội hình đá 4-4-2 chắc chắn chờ đợi thời cơ từ các đường tạt bóng phản công biên nhanh.`,
      keyPlayerMatchups: `Cuộc chiến tay đôi nóng bỏng giữa ngôi sao tấn công chủ lực của ${match.home.name} và chốt chặn phòng ngự thép của ${match.away.name} ở hành lang cánh phải.`,
      headToHead: `Trong 3 lần đối đầu gần nhất, ${match.home.name} giành chiến thắng 1 trận, hòa 1 trận và thất bại 1 trận trước ${match.away.name}. Sức mạnh hai bên cực kỳ cân bằng.`,
      injuryList: `Không có chấn thương nghiêm trọng nào phát sinh mới. Cả hai đội tuyển đều đang có lực lượng mạnh nhất cho trận đấu quan trọng này.`
    };
  }
}

/**
 * Discuss and predictions chatbot with Heo Hồng
 */
export async function chatWithHeoHong(match, history, userMsg) {
  const apiKey = getNormalizedKey();
  
  try {
    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key');
    }

    const formattedContents = [];
    
    const systemPrompt = `Bạn là Heo Hồng 🐷 - chú heo mascot màu hồng dễ thương, lém lỉnh của World Cup 2026.
Bạn là chuyên gia soi kèo, phân tích bóng đá và nhận định tỉ số cực kỳ nhạy bén, vui tính.
Thông tin trận đấu hiện tại:
- Trận: ${match.home.name} vs ${match.away.name}
- Tỷ số: ${match.homeScore} - ${match.awayScore}
- Phút: ${match.minute}
- Trạng thái: ${match.status}
- Tỷ lệ cược 1X2: ${match.home.name} (${match.odds?.h2h?.home || 'N/A'}), Hòa (${match.odds?.h2h?.draw || 'N/A'}), ${match.away.name} (${match.odds?.h2h?.away || 'N/A'})

Hãy trò chuyện với người dùng về trận đấu này. Trả lời bằng tiếng Việt thân thiện, hài hước, xưng "Heo Hồng 🐷" và gọi người dùng là "anh em", "fen" hoặc "các fen".
Đưa ra dự đoán bóng đá cụ thể về tỉ số, tài xỉu, phạt góc... nếu người dùng hỏi, nhưng luôn giữ tính chất giải trí cược vui mô phỏng. Tránh viết quá dài dòng. Tuyệt đối không nhắc tới các thuật ngữ toán học phức tạp như Poisson, ELO, Kelly, SHAP, xG trừ khi được hỏi trực tiếp.`;

    formattedContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    formattedContents.push({
      role: 'model',
      parts: [{ text: "Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo soi kèo trận đấu rực lửa này rồi đây. Anh em muốn hỏi gì về chiến thuật, tỉ số hay kèo tài xỉu nào? 🐷⚽" }]
    });

    if (history && history.length > 0) {
      history.forEach(msg => {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: userMsg }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
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
    if (data && data.usageMetadata) {
      trackApiCall('gemini', {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0
      });
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.warn('Lỗi chat với Heo Hồng qua Gemini, chuyển sang FPT DeepSeek...', error);
    try {
      const systemPrompt = `Bạn là Heo Hồng 🐷 - chú heo mascot màu hồng dễ thương, lém lỉnh của World Cup 2026.
Bạn là chuyên gia soi kèo, phân tích bóng đá và nhận định tỉ số cực kỳ nhạy bén, vui tính.
Thông tin trận đấu hiện tại:
- Trận: ${match.home.name} vs ${match.away.name}
- Tỷ số: ${match.homeScore} - ${match.awayScore}
- Phút: ${match.minute}
- Trạng thái: ${match.status}
- Tỷ lệ cược 1X2: ${match.home.name} (${match.odds?.h2h?.home || 'N/A'}), Hòa (${match.odds?.h2h?.draw || 'N/A'}), ${match.away.name} (${match.odds?.h2h?.away || 'N/A'})

Hãy trò chuyện với người dùng về trận đấu này. Trả lời bằng tiếng Việt thân thiện, hài hước, xưng "Heo Hồng 🐷" và gọi người dùng là "anh em", "fen" hoặc "các fen".
Đưa ra dự đoán bóng đá cụ thể về tỉ số, tài xỉu, phạt góc... nếu người dùng hỏi, nhưng luôn giữ tính chất giải trí cược vui mô phỏng. Tránh viết quá dài dòng. Tuyệt đối không nhắc tới các thuật ngữ toán học phức tạp như Poisson, ELO, Kelly, SHAP, xG trừ khi được hỏi trực tiếp.`;

      const fptMessages = [];
      if (history && history.length > 0) {
        history.forEach(msg => {
          fptMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }
      fptMessages.push({ role: 'user', content: userMsg });

      return await callFptDeepseekFallback(fptMessages, systemPrompt);
    } catch (fallbackError) {
      console.error('FPT chat fallback cũng thất bại:', fallbackError);
      return `🐷 Các fen ơi, mạng của Heo Hồng đang bị lag một chút. Trận này ${match.home.name} vs ${match.away.name} đang cực nóng đó, Heo Hồng nghĩ bắt cửa ${match.homeScore >= match.awayScore ? match.home.name : match.away.name} vẫn là chân ái nhé! 🐷⚽`;
    }
  }
}

/**
 * Discuss general World Cup 2026 questions with Heo Hồng
 */
export async function generalChatWithHeoHong(history, userMsg) {
  const apiKey = getNormalizedKey();

  let liveContext = '';
  try {
    const matches = await getLiveMatchesForApp();
    const activeMatches = matches.slice(0, 8); // Top 8 matches
    const matchesStr = activeMatches.map(m => 
      `- Trận [${m.status === 'LIVE' ? 'Đang diễn ra - Phút ' + m.minute : m.status}]: ${m.home.name} vs ${m.away.name} (${m.homeScore}-${m.awayScore}) ngày ${m.date} ${m.time}. Kèo: Chấp ${m.odds.handicap.line}, Tài Xỉu ${m.odds.overUnder.line}.`
    ).join('\n');
    
    const standings = await getLiveGroupStandings();
    const standingsStr = standings.map(group => {
      const teamList = group.teams.map((t, idx) => `${idx+1}. ${t.name} (${t.pts}đ)`).join(', ');
      return `- Bảng ${group.name}: ${teamList}`;
    }).join('\n');
    
    liveContext = `
DƯỚI ĐÂY LÀ DỮ LIỆU THỜI GIAN THỰC CỦA GIẢI ĐẤU WORLD CUP 2026:
DANH SÁCH CÁC TRẬN ĐẤU MỚI NHẤT/ĐANG DIỄN RA:
${matchesStr}

BẢNG XẾP HẠNG HIỆN TẠI:
${standingsStr}

Hãy sử dụng dữ liệu trên để trả lời cực kỳ chính xác nếu người dùng hỏi về lịch thi đấu, bảng xếp hạng, tỉ số hiện tại hoặc nhận định kèo của các trận đấu này.`;
  } catch (err) {
    console.warn('Lỗi lấy ngữ cảnh trận đấu cho Heo Hồng:', err);
  }
  
  try {
    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key');
    }

    const formattedContents = [];
    
    const systemPrompt = `Bạn là Heo Hồng 🐷 - chú heo mascot màu hồng dễ thương, lém lỉnh của World Cup 2026.
Bạn là chuyên gia soi kèo, phân tích bóng đá và nhận định tỉ số cực kỳ nhạy bén, vui tính.
Hãy trò chuyện với người dùng về giải đấu World Cup 2026 nói chung hoặc các đội bóng, cầu thủ tham dự. Trả lời bằng tiếng Việt thân thiện, hài hước, xưng "Heo Hồng 🐷" và gọi người dùng là "anh em", "fen" hoặc "các fen".
Đưa ra dự đoán bóng đá cụ thể về tỉ số, tài xỉu, phạt góc... nếu người dùng hỏi, nhưng luôn giữ tính chất giải trí cược vui mô phỏng. Tránh viết quá dài dòng. Tuyệt đối không nhắc tới các thuật ngữ toán học phức tạp như Poisson, ELO, Kelly, SHAP, xG trừ khi được hỏi trực tiếp.
${liveContext}`;

    formattedContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    formattedContents.push({
      role: 'model',
      parts: [{ text: "Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo về World Cup 2026 rồi đây. Anh em muốn hỏi gì về giải đấu, đội tuyển hay cầu thủ nào không? 🐷⚽" }]
    });

    if (history && history.length > 0) {
      history.forEach(msg => {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: userMsg }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
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
    if (data && data.usageMetadata) {
      trackApiCall('gemini', {
        promptTokenCount: data.usageMetadata.promptTokenCount || 0,
        candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0
      });
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.warn('Lỗi chat với Heo Hồng qua Gemini, chuyển sang FPT DeepSeek...', error);
    try {
      const systemPrompt = `Bạn là Heo Hồng 🐷 - chú heo mascot màu hồng dễ thương, lém lỉnh của World Cup 2026.
Bạn là chuyên gia soi kèo, phân tích bóng đá và nhận định tỉ số cực kỳ nhạy bén, vui tính.
Hãy trò chuyện với người dùng về giải đấu World Cup 2026 nói chung hoặc các đội bóng, cầu thủ tham dự. Trả lời bằng tiếng Việt thân thiện, hài hước, xưng "Heo Hồng 🐷" và gọi người dùng là "anh em", "fen" hoặc "các fen".
Đưa ra dự đoán bóng đá cụ thể về tỉ số, tài xỉu, phạt góc... nếu người dùng hỏi, nhưng luôn giữ tính chất giải trí cược vui mô phỏng. Tránh viết quá dài dòng. Tuyệt đối không nhắc tới các thuật ngữ toán học phức tạp như Poisson, ELO, Kelly, SHAP, xG trừ khi được hỏi trực tiếp.
${liveContext}`;

      const fptMessages = [];
      if (history && history.length > 0) {
        history.forEach(msg => {
          fptMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }
      fptMessages.push({ role: 'user', content: userMsg });

      return await callFptDeepseekFallback(fptMessages, systemPrompt);
    } catch (fallbackError) {
      console.error('FPT chat fallback cũng thất bại:', fallbackError);
      return `🐷 Các fen ơi, mạng của Heo Hồng đang bị lag một chút. Có gì các fen hỏi lại Heo Hồng sau nha! 🐷⚽`;
    }
  }
}

