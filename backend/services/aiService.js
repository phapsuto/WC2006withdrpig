const { predictMatch } = require('../utils/aiPredictor');

// Base function to call FPT DeepSeek API
async function callDeepSeek(prompt) {
  const apiKey = process.env.FPT_AI_API_KEY;
  const baseUrl = process.env.FPT_AI_BASE_URL || 'https://mkp-api.fptcloud.com/v1/chat/completions';
  const modelName = process.env.FPT_AI_MODEL || 'DeepSeek-V4-Flash';
  
  if (!apiKey) {
    throw new Error('Chưa cấu hình FPT_AI_API_KEY trong .env backend');
  }

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1200
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Lỗi HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * AI Sports Analytics Intelligence (xG, Kelly, SHAP + Real Expected Value analysis)
 * Evaluates 1X2, Handicap, and Over/Under
 */
exports.generateMatchAnalytics = async function(match, allMatches = []) {
  // 1. Get the mathematical predictions
  const prediction = predictMatch(
    match.home.name,
    match.away.name,
    match.homeScore,
    match.awayScore,
    match.status,
    match.minute,
    allMatches,
    match.odds
  );

  const homeWin = prediction.probabilities.homeWin;
  const draw = prediction.probabilities.draw;
  const awayWin = prediction.probabilities.awayWin;
  const expectedHomeGoals = prediction.analytics.expectedHomeGoals;
  const expectedAwayGoals = prediction.analytics.expectedAwayGoals;
  const over25 = prediction.probabilities.over25;
  const under25 = prediction.probabilities.under25;
  const btts = prediction.probabilities.btts;
  const homeCleanSheet = prediction.probabilities.homeCleanSheet;
  const awayCleanSheet = prediction.probabilities.awayCleanSheet;
  const heatmapGrid = prediction.analytics.heatmapGrid;
  const topScorelines = prediction.analytics.topScorelines;
  const valueBets = prediction.analytics.valueBets;

  // 2. Prepare the Odds string to pass to the AI
  const oddsH2H = match.odds?.h2h || { home: 0, draw: 0, away: 0 };
  const oddsHandicap = match.odds?.handicap || { line: 'N/A', home: 0, away: 0 };
  const oddsOU = match.odds?.overUnder || { line: 'N/A', over: 0, under: 0 };

  const prompt = `Bạn là hệ thống Trí tuệ Nhân tạo Phân tích Bóng đá Chuyên sâu (Quantitative Sports Analyst) tích hợp nhận định của Heo Hồng 🐷.
Chúng tôi đã chạy mô hình phân tích định lượng (Bivariate Poisson & ELO) và thu được các kết quả xác suất thực tế (Expected Probability) sau:
- Chỉ số sức mạnh ELO: ${match.home.name} (${prediction.analytics.homeElo}) vs ${match.away.name} (${prediction.analytics.awayElo})
- Cơ hội ghi bàn dự kiến (xG): ${match.home.name} là ${expectedHomeGoals}, ${match.away.name} là ${expectedAwayGoals}
- Xác suất 1X2 Thực Tế: ${match.home.name} thắng ${homeWin}%, Hòa ${draw}%, ${match.away.name} thắng ${awayWin}%
- Xác suất Tài Xỉu 2.5 Thực Tế: Tài ${over25}%, Xỉu ${under25}%
- BTTS (Cả 2 đội ghi bàn): ${btts}%, Sạch lưới ${match.home.name}: ${homeCleanSheet}%, Sạch lưới ${match.away.name}: ${awayCleanSheet}%
- Top 3 tỷ số có xác suất cao nhất: ${topScorelines.map(s => `${s.score} (${s.percent}%)`).join(', ')}
- Các Kèo Thơm (+EV) phát hiện được: ${valueBets.length > 0 ? valueBets.map(v => `${v.label} (EV: +${(v.ev * 100).toFixed(1)}%)`).join(', ') : 'Không có'}

Dưới đây là Tỷ lệ cược (Bookmaker Odds) của trận đấu hiện tại:
- Châu Âu (1X2): Chủ ${oddsH2H.home} - Hòa ${oddsH2H.draw} - Khách ${oddsH2H.away}
- Chấp Châu Á (Handicap): Chấp ${oddsHandicap.line} (Chủ ${oddsHandicap.home} - Khách ${oddsHandicap.away})
- Tài Xỉu (Over/Under): Mốc ${oddsOU.line} (Tài ${oddsOU.over} - Xỉu ${oddsOU.under})

Thông tin trận đấu:
Đội nhà: ${match.home.name} vs Đội khách: ${match.away.name} (Tỷ số hiện tại: ${match.homeScore}-${match.awayScore}, phút: ${match.minute}, trạng thái: ${match.status}).

YÊU CẦU PHÂN TÍCH KÈO (GIÁO TRÌNH):
1. Tính Xác suất Ngầm định (Implied Probability) = 1 / Tỷ lệ cược.
2. So sánh Xác suất Ngầm định với Xác suất Thực Tế của Poisson ở trên cho TẤT CẢ các kèo (1X2, Handicap, Tài Xỉu).
3. Kèo có Giá trị Kỳ vọng (Expected Value - EV) cao nhất là kèo có chênh lệch dương (Xác suất thực tế > Xác suất ngầm định) lớn nhất.
4. Lựa chọn ra đúng 1 Kèo thơm nhất (Value Bet) trong số TẤT CẢ các kèo trên. KHÔNG bị giới hạn chỉ ở kèo 1X2. Có thể chọn Tài Xỉu hoặc Kèo Chấp nếu EV của chúng ngon hơn.
5. Đưa ra gợi ý số % vốn cược (1% - 10%) dựa trên rủi ro của kèo được chọn theo công thức Kelly thu gọn.

Yêu cầu ngôn ngữ và định dạng:
- Xưng "Heo Hồng 🐷" và gọi "anh em" hoặc "các fen" khi viết nội dung 'rationale' (lý do chọn kèo).
- Giải thích vì sao kèo đó là ngon nhất bằng các từ bình dân dễ hiểu (không dùng các từ như Poisson, Implied Probability trong phần rationale).
- Báo cáo phải bao gồm phần: Phân tích chiến thuật (tacticalReview), Cầu thủ chủ chốt (keyPlayerMatchups), Lịch sử đối đầu (headToHead), và Danh sách chấn thương (injuryList).

Hãy trả về kết quả dưới dạng JSON object hợp lệ:
{
  "homeXG": ${expectedHomeGoals},
  "awayXG": ${expectedAwayGoals},
  "xgTimeline": "Phân tích 80-100 từ về thế trận và số bàn thắng kỳ vọng của 2 đội...",
  "kellyCriterion": {
    "stakePercent": "Số nguyên (1 đến 10)",
    "recommendedBet": "Tên kèo thơm nhất được chọn (Ví dụ: Tài 2.5, Chấp -0.5, hoặc Kèo 1X2 Hòa)",
    "rationale": "Lý giải dí dỏm bằng tiếng Việt từ Heo Hồng 🐷 giải thích tại sao cửa này có xác suất chiến thắng cao hơn mức tỷ lệ cược nhà cái đưa ra...",
    "confidenceScore": "Số nguyên từ 50 đến 99, thể hiện độ tự tin của kèo (Ví dụ: 85)"
  },
  "shapExplainability": [
    { "factor": "Phong độ và thực lực đội bóng", "weight": "số nguyên %" },
    { "factor": "Lợi thế sân bãi và tỷ lệ cược", "weight": "số nguyên %" },
    { "factor": "Thống kê phong độ đối đầu", "weight": "số nguyên %" },
    { "factor": "Tính bất ngờ của giải đấu", "weight": "số nguyên %" }
  ],
  "tacticalReview": "Nhận định chiến thuật sơ lược...",
  "keyPlayerMatchups": "Những cặp đối đầu nóng trên sân...",
  "headToHead": "Tóm tắt lịch sử chạm trán...",
  "injuryList": "Cập nhật danh sách chấn thương..."
}
Chỉ trả về chuỗi JSON, không kèm markdown hay ký tự nào khác.`;

  try {
    const jsonStr = await callDeepSeek(prompt);
    const cleaned = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const result = JSON.parse(cleaned);
    
    // Merge the exact mathematical arrays directly into the result to avoid LLM hallucination on large arrays
    result.heatmapGrid = heatmapGrid;
    result.topScorelines = topScorelines;
    result.valueBets = valueBets;
    result.btts = btts;
    result.homeCleanSheet = homeCleanSheet;
    result.awayCleanSheet = awayCleanSheet;

    return result;
  } catch (error) {
    console.error('Lỗi Gemini Phân tích sâu (Backend):', error);
    // Trả về Fallback an toàn nếu LLM lỗi
    return {
      homeXG: expectedHomeGoals,
      awayXG: expectedAwayGoals,
      xgTimeline: `Heo Hồng nhận định: Đội tuyển ${match.home.name} đang tạo ra số bàn thắng dự kiến là ${expectedHomeGoals}, trong khi ${match.away.name} là ${expectedAwayGoals}.`,
      kellyCriterion: {
        stakePercent: 2,
        recommendedBet: homeWin > awayWin ? `Kèo 1X2 - ${match.home.name} thắng` : `Kèo 1X2 - ${match.away.name} thắng`,
        rationale: `🐷 Mạng của Heo Hồng đang lag nên Heo tự chọn kèo an toàn nhất dựa theo sức mạnh ELO cho các fen nhé!`,
        confidenceScore: 75
      },
      shapExplainability: [
        { factor: "Phong độ thi đấu và sức mạnh", weight: 45 },
        { factor: "Thống kê sút bóng thực tế", weight: 25 },
        { factor: "Tương quan đội hình ra sân", weight: 20 },
        { factor: "Yếu tố sân bãi và di chuyển", weight: 10 }
      ],
      tacticalReview: `Đang chờ AI Phân tích lại chiến thuật của 2 đội...`,
      keyPlayerMatchups: `Sức nóng khu vực giữa sân sẽ quyết định thành bại.`,
      headToHead: `Sức mạnh hai bên cực kỳ cân bằng trong lịch sử.`,
      injuryList: `Không có chấn thương nghiêm trọng nào phát sinh mới.`,
      heatmapGrid,
      topScorelines,
      valueBets,
      btts,
      homeCleanSheet,
      awayCleanSheet
    };
  }
};
