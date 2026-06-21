// fptDeepseek.js — FPT Cloud DeepSeek API Translation & Summarization Service
// Uses model: DeepSeek-V4-Flash
// Endpoint: https://mkp-api.fptcloud.com/v1/chat/completions

const FPT_API_URL = 'https://mkp-api.fptcloud.com/v1/chat/completions';
const FPT_API_KEY = import.meta.env.VITE_FPT_CLOUD_API_KEY || '';
const FPT_MODEL = 'DeepSeek-V4-Flash';

async function callFptDeepseek(prompt) {
  try {
    const response = await fetch(FPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FPT_API_KEY}`
      },
      body: JSON.stringify({
        model: FPT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý dịch thuật và tóm tắt tin tức thể thao bóng đá chuyên nghiệp bằng tiếng Việt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FPT API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[fptDeepseek] API call error:', error);
    throw error;
  }
}

/**
 * Translate news title and description to Vietnamese
 */
export async function translateRssNews(title, description) {
  const prompt = `Hãy dịch tiêu đề và mô tả bài báo thể thao sau đây từ Tiếng Anh sang Tiếng Việt. Tiêu đề dịch cần giật gân, cuốn hút đúng phong cách báo bóng đá Việt Nam (như Bongdaplus, Kenh14).
Mô tả dịch cần trôi chảy, tự nhiên.

Tiêu đề gốc: ${title}
Mô tả gốc: ${description}

Trả về kết quả duy nhất dưới dạng JSON:
{
  "translatedTitle": "Tiêu đề tiếng Việt",
  "translatedDescription": "Mô tả tiếng Việt"
}
Chỉ trả về JSON sạch, không có ký tự lạ hay khối code markdown \`\`\`json.`;

  try {
    const result = await callFptDeepseek(prompt);
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('[fptDeepseek] Fallback translate due to error:', error);
    return {
      translatedTitle: `[Dịch] ${title}`,
      translatedDescription: description
    };
  }
}

/**
 * Summarize news article with AI insights
 */
export async function summarizeRssNews(title, description) {
  const prompt = `Hãy tóm tắt bài viết sau đây bằng 3 gạch đầu dòng ngắn gọn, súc tích bằng tiếng Việt. Cuối cùng, hãy đưa ra một câu bình luận vui vẻ từ "Heo Hồng 🐷" (xưng hô "Heo Hồng 🐷" và gọi độc giả là "các fen").

Tiêu đề: ${title}
Nội dung: ${description}

Yêu cầu:
- Trả về nội dung dạng HTML đơn giản (sử dụng các thẻ <ul>, <li>, <p>).
- Bình luận của Heo Hồng nằm trong thẻ <p style="font-style: italic; color: var(--primary); margin-top: 8px;">.
- Không chứa codeblock hay chữ nào khác ngoài mã HTML kết quả.`;

  try {
    return await callFptDeepseek(prompt);
  } catch (error) {
    console.warn('[fptDeepseek] Fallback summary due to error:', error);
    return `
      <ul>
        <li>Bản tóm tắt tin tức về trận đấu ${title}.</li>
        <li>Thông tin chi tiết đang cập nhật trực tiếp tại giải đấu.</li>
        <li>Anh em hãy chú ý đón đọc diễn biến mới nhất.</li>
      </ul>
      <p style="font-style: italic; color: var(--primary); margin-top: 8px;">🐷 Heo Hồng 🐷: Mạng lag tí các fen ơi, nhưng tin này vẫn cực nóng, gieo quẻ ngay cho nóng nhé! 🐷⚽🔮</p>
    `;
  }
}

/**
 * Translate full article content to Vietnamese
 */
export async function translateFullContent(title, content) {
  const prompt = `Hãy dịch bài báo thể thao sau đây từ Tiếng Anh sang Tiếng Việt. Đảm bảo dịch đầy đủ 100% nội dung (toàn văn), trôi chảy, mạch lạc, chính xác từ ngữ chuyên môn bóng đá.
Tiêu đề bài viết: ${title}
Nội dung bài viết:
${content}

Hãy trả về kết quả dịch trực tiếp dưới dạng văn bản tiếng Việt trôi chảy (không trả về định dạng JSON, không chứa block code markdown, chỉ trả về văn bản dịch).`;

  try {
    return await callFptDeepseek(prompt);
  } catch (error) {
    console.warn('[fptDeepseek] Fallback full translate due to error:', error);
    return `[Bản dịch tự động dự phòng] ${content}`;
  }
}

