#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║  🐷 Heo Hồng WC2026 Telegram Bot — Trợ lý AI & Đồng bộ IDE Agent     ║
║  Mascot lém lỉnh nhận định World Cup 2026 và sync 2 chiều với IDE    ║
╚══════════════════════════════════════════════════════════════════════╝

Cách chạy:
    python3 scripts/telegram_bot.py
"""

import os
import sys
import json
import time
import logging
import html
import re
import threading
import subprocess
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv

# Load environment variables
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

# ══════════════════════════════════════════════════
# CẤU HÌNH
# ══════════════════════════════════════════════════
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
FPT_CLOUD_API_KEY = os.environ.get("FPT_CLOUD_API_KEY", "")
FPT_CLOUD_BASE_URL = "https://mkp-api.fptcloud.com/v1"
FPT_MODEL = "DeepSeek-V4-Flash"

PORT_SOCKET_LOCK = 12005
MAX_HISTORY_LEN = 15

# Memory chat history for Heo Hồng AI (per chat_id)
chat_histories = {}

# Set up logging
os.makedirs(os.path.join(SCRIPT_DIR, "logs"), exist_ok=True)
logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(SCRIPT_DIR, "logs", "telegram_bot.log"), encoding="utf-8"),
    ]
)
logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════
# TELEGRAM API HELPERS
# ══════════════════════════════════════════════════
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def tg_request(method: str, data: dict = None, timeout: float = 30.0) -> dict:
    url = f"{TELEGRAM_API}/{method}"
    try:
        resp = requests.post(url, json=data, timeout=timeout)
        result = resp.json()
        if not result.get("ok"):
            logger.error(f"Telegram API error: {result}")
        return result
    except Exception as e:
        logger.error(f"Telegram API request failed: {e}")
        return {"ok": False, "error": str(e)}

def md_to_html(text: str) -> str:
    """Chuyển đổi Markdown sang HTML cho Telegram."""
    text = html.escape(text, quote=False)
    
    code_blocks = []
    def save_code_block(match):
        code_blocks.append(match.group(1))
        return f"__CODE_BLOCK_{len(code_blocks)-1}__"
        
    text = re.sub(r'```(?:\w+)?\n(.*?)\n```', save_code_block, text, flags=re.DOTALL)
    text = re.sub(r'```(.*?)```', save_code_block, text, flags=re.DOTALL)
    
    lines = text.split("\n")
    for i in range(len(lines)):
        line = lines[i]
        stripped = line.strip()
        
        if stripped.startswith("# "):
            lines[i] = f"<b>🏆 {stripped[2:].upper()}</b>"
        elif stripped.startswith("## "):
            lines[i] = f"\n<b>⚽ {stripped[3:]}</b>"
        elif stripped.startswith("### "):
            lines[i] = f"\n<b>🐷 {stripped[4:]}</b>"
        elif stripped.startswith("#### "):
            lines[i] = f"\n<b>🔸 {stripped[5:]}</b>"
        elif stripped == "---":
            lines[i] = "──────────────────"
        elif stripped.startswith("- ") or stripped.startswith("* ") or stripped.startswith("+ "):
            lines[i] = f"  • {stripped[2:]}"
            
    text = "\n".join(lines)
    
    for idx, block in enumerate(code_blocks):
        text = text.replace(f"__CODE_BLOCK_{idx}__", f"<pre>{block}</pre>")
        
    text = re.sub(r'`([^`\n]+)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*([^*<\n]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*([^*<\n]+)\*', r'<b>\1</b>', text)
    text = re.sub(r'_([^_<\n]+)_', r'<i>\1</i>', text)
    
    return text

def send_message(chat_id: int, text: str, parse_mode: str = "HTML",
                 reply_to: int = None, disable_preview: bool = True) -> dict:
    if parse_mode == "HTML":
        text = md_to_html(text)
        
    if len(text) > 4000:
        parts = split_message(text, 4000)
        result = None
        for part in parts:
            payload = {
                "chat_id": chat_id,
                "text": part,
                "reply_to_message_id": reply_to,
                "disable_web_page_preview": disable_preview,
            }
            if parse_mode:
                payload["parse_mode"] = parse_mode
            result = tg_request("sendMessage", payload)
        return result
    
    payload = {
        "chat_id": chat_id,
        "text": text,
        "reply_to_message_id": reply_to,
        "disable_web_page_preview": disable_preview,
    }
    if parse_mode:
        payload["parse_mode"] = parse_mode
    return tg_request("sendMessage", payload)

def send_typing(chat_id: int):
    tg_request("sendChatAction", {"chat_id": chat_id, "action": "typing"})

def split_message(text: str, max_len: int = 4000) -> list:
    if len(text) <= max_len:
        return [text]
    parts = []
    while text:
        if len(text) <= max_len:
            parts.append(text)
            break
        split_pos = text.rfind("\n", 0, max_len)
        if split_pos == -1:
            split_pos = text.rfind(". ", 0, max_len)
        if split_pos == -1:
            split_pos = max_len
        parts.append(text[:split_pos])
        text = text[split_pos:].lstrip()
    return parts

# ══════════════════════════════════════════════════
# FOOTBALL API DATA CORES
# ══════════════════════════════════════════════════
def get_live_context_str() -> str:
    """Lấy dữ liệu World Cup từ API worldcup26.ir để inject làm context."""
    try:
        # 1. Lấy danh sách trận đấu
        games_resp = requests.get("https://worldcup26.ir/get/games", timeout=10)
        matches_str = ""
        if games_resp.status_code == 200:
            games_data = games_resp.json()
            # Lấy tối đa 10 trận đấu gần nhất/live
            active_games = games_data[:10] if isinstance(games_data, list) else []
            match_lines = []
            for g in active_games:
                status = g.get("status", "UPCOMING")
                minute = g.get("minute", 0)
                status_txt = f"Đang diễn ra - Phút {minute}'" if status == "LIVE" else status
                h_name = g.get("home", {}).get("name", "N/A")
                a_name = g.get("away", {}).get("name", "N/A")
                h_score = g.get("homeScore", 0)
                a_score = g.get("awayScore", 0)
                g_date = g.get("date", "")
                
                # Handicap/OU if present
                odds = g.get("odds", {})
                hc = odds.get("handicap", {}).get("line", "N/A")
                ou = odds.get("overUnder", {}).get("line", "N/A")
                
                match_lines.append(
                    f"- Trận [{status_txt}]: {h_name} {h_score} - {a_score} {a_name} (Ngày {g_date}). Kèo: Chấp {hc}, Tài Xỉu {ou}."
                )
            matches_str = "\n".join(match_lines)
            
        # 2. Lấy bảng xếp hạng
        groups_resp = requests.get("https://worldcup26.ir/get/groups", timeout=10)
        standings_str = ""
        if groups_resp.status_code == 200:
            groups_data = groups_resp.json()
            group_lines = []
            for group in (groups_data if isinstance(groups_data, list) else []):
                g_name = group.get("name", "")
                teams_list = []
                for idx, t in enumerate(group.get("teams", [])):
                    teams_list.append(f"{idx+1}. {t.get('name')} ({t.get('pts')}đ)")
                group_lines.append(f"- Bảng {g_name}: {', '.join(teams_list)}")
            standings_str = "\n".join(group_lines)
            
        context = f"""
DƯỚI ĐÂY LÀ DỮ LIỆU THỜI GIAN THỰC CỦA GIẢI ĐẤU WORLD CUP 2026:
DANH SÁCH CÁC TRẬN ĐẤU MỚI NHẤT/ĐANG DIỄN RA:
{matches_str or '- Chưa có dữ liệu trận đấu.'}

BẢNG XẾP HẠNG HIỆN TẠI:
{standings_str or '- Chưa có dữ liệu bảng xếp hạng.'}

Hãy sử dụng dữ liệu trên để trả lời cực kỳ chính xác nếu người dùng hỏi về lịch thi đấu, bảng xếp hạng, tỉ số hiện tại hoặc nhận định kèo của các trận đấu này."""
        return context
    except Exception as e:
        logger.warning(f"Không thể cào dữ liệu live cho Heo Hồng: {e}")
        return "\n(Lưu ý: Không thể lấy dữ liệu trực tiếp từ API do lỗi kết nối.)"


# ══════════════════════════════════════════════════
# GEMINI & DEEPSEEK CORE CHAT
# ══════════════════════════════════════════════════
def call_heohong_chat(chat_id: int, user_msg: str) -> str:
    """Gọi Gemini API hoặc Fallback FPT DeepSeek để trò chuyện Heo Hồng 🐷."""
    # Khởi tạo history nếu chưa có
    if chat_id not in chat_histories:
        chat_histories[chat_id] = []
        
    history = chat_histories[chat_id]
    live_ctx = get_live_context_str()
    
    system_prompt = f"""Bạn là Heo Hồng 🐷 - chú heo mascot màu hồng dễ thương, lém lỉnh của World Cup 2026.
Bạn là chuyên gia soi kèo, phân tích bóng đá và nhận định tỉ số cực kỳ nhạy bén, vui tính.
Hãy trò chuyện với người dùng về giải đấu World Cup 2026 nói chung hoặc các đội bóng, cầu thủ tham dự. Trả lời bằng tiếng Việt thân thiện, hài hước, xưng "Heo Hồng 🐷" và gọi người dùng là "anh em", "fen" hoặc "các fen".
Đưa ra dự đoán bóng đá cụ thể về tỉ số, tài xỉu, phạt góc... nếu người dùng hỏi, nhưng luôn giữ tính chất giải trí cược vui mô phỏng. Tránh viết quá dài dòng. Tuyệt đối không nhắc tới các thuật ngữ toán học phức tạp như Poisson, ELO, Kelly, SHAP, xG trừ khi được hỏi trực tiếp.
{live_ctx}"""

    # Gọi Gemini
    if GEMINI_API_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        # Build contents
        contents = [
            {"role": "user", "parts": [{"text": system_prompt}]},
            {"role": "model", "parts": [{"text": "Chào các fen! Heo Hồng 🐷 đã sẵn sàng cùng anh em đàm đạo về World Cup 2026 rồi đây. Anh em muốn hỏi gì về giải đấu, nhận định tỉ số hay kèo cược cúp thế giới nào? 🐷⚽"}]}
        ]
        
        for msg in history:
            contents.append({
                "role": "user" if msg["role"] == "user" else "model",
                "parts": [{"text": msg["content"]}]
            })
            
        contents.append({
            "role": "user",
            "parts": [{"text": user_msg}]
        })
        
        try:
            resp = requests.post(url, json={
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 800
                }
            }, timeout=20)
            
            if resp.status_code == 200:
                data = resp.json()
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Update history
                history.append({"role": "user", "content": user_msg})
                history.append({"role": "model", "content": reply})
                if len(history) > MAX_HISTORY_LEN * 2:
                    chat_histories[chat_id] = history[-(MAX_HISTORY_LEN * 2):]
                return reply
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}, switching to fallback...")
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}, switching to fallback...")
            
    # Fallback to FPT DeepSeek
    if FPT_CLOUD_API_KEY:
        url = f"{FPT_CLOUD_BASE_URL}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {FPT_CLOUD_API_KEY}"
        }
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })
        messages.append({"role": "user", "content": user_msg})
        
        try:
            resp = requests.post(url, json={
                "model": FPT_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 800
            }, headers=headers, timeout=20)
            
            if resp.status_code == 200:
                data = resp.json()
                reply = data["choices"][0]["message"]["content"]
                
                # Update history
                history.append({"role": "user", "content": user_msg})
                history.append({"role": "model", "content": reply})
                if len(history) > MAX_HISTORY_LEN * 2:
                    chat_histories[chat_id] = history[-(MAX_HISTORY_LEN * 2):]
                return reply
        except Exception as e:
            logger.error(f"FPT Cloud API call fallback failed: {e}")
            
    return "🐷 Ối fen ơi, Heo Hồng bị nghẹn ngô rồi, không kết nối được mạng AI! Bắt cửa chủ nhà ăn kèo thơm nhé! 🐷⚽"


# ══════════════════════════════════════════════════
# COMMAND HANDLERS
# ══════════════════════════════════════════════════
def handle_start(chat_id: int, user_name: str):
    welcome = (
        "🐷 *Chào mừng anh em đến với Trợ Lý Tiên Tri Heo Hồng!* 🐷\n\n"
        f"Xin chào *{user_name}*! Tôi là Heo Hồng, linh vật dự toán và soi kèo "
        "thần sầu của giải vô địch thế giới World Cup 2026! ⚽🏆\n\n"
        "🔹 *Gõ bất kỳ câu hỏi nào* — Tôi sẽ trả lời với dữ liệu bảng đấu, lịch thi đấu trực tiếp.\n"
        "🔹 `/status` — Kiểm tra các trận đấu & trạng thái IDE.\n"
        "🔹 `/sync` — Đồng bộ trực tiếp 2 chiều với IDE Agent.\n"
        "🔹 `/help` — Xem hướng dẫn chi tiết các lệnh.\n\n"
        "💡 *Ví dụ:*\n"
        "_Hôm nay có trận nào hot không heo?_\n"
        "_Nhận định trận khai mạc giùm anh em!_\n"
        "_Bảng xếp hạng bảng A thế nào heo ơi?_"
    )
    send_message(chat_id, welcome)

def handle_help(chat_id: int):
    help_text = (
        "📖 *Hướng dẫn sử dụng Heo Hồng Bot* 🐷\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "💬 *Đàm đạo bóng đá*\n"
        "Hỏi han Heo Hồng về kèo cược, tỉ số, các đội bóng tại World Cup 2026. "
        "Bot tự cập nhật dữ liệu trực tiếp để trả lời anh em.\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "💻 *Lệnh điều khiển IDE Agent*\n"
        "`/agent [lệnh]` — Ra lệnh trực tiếp cho AI Agent trong IDE.\n"
        "Ví dụ: `/agent viết lại hàm get_live_context`\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "🔗 *Lệnh đồng bộ 2 chiều*\n"
        "`/sync` — Bật đồng bộ trực tiếp. Mọi tin nhắn bình thường (không cần gõ `/agent`) sẽ được đẩy thẳng vào IDE chat.\n"
        "`/sync off` — Tắt đồng bộ, quay lại đàm đạo với Heo Hồng AI.\n\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "📊 *Lệnh hệ thống*\n"
        "`/status` — Trạng thái API World Cup, các trận đấu hot và kết nối IDE."
    )
    send_message(chat_id, help_text)

def handle_status(chat_id: int):
    send_typing(chat_id)
    
    # Check worldcup26.ir health
    api_online = False
    match_summary = ""
    try:
        resp = requests.get("https://worldcup26.ir/get/games", timeout=5)
        if resp.status_code == 200:
            api_online = True
            games = resp.json()
            live_count = sum(1 for g in games if g.get("status") == "LIVE")
            upcoming_count = sum(1 for g in games if g.get("status") == "UPCOMING")
            match_summary = f"⚽ Đang trực tiếp: {live_count} trận | Sắp diễn ra: {upcoming_count} trận"
    except:
        pass
        
    conv_id = get_current_conversation_id()
    sync_enabled = is_sync_enabled(chat_id)
    
    status_msg = (
        "📊 *Trạng thái Hệ thống Heo Hồng Bot:*\n\n"
        f"🌐 *API worldcup26.ir:* {'🟢 ONLINE' if api_online else '🔴 OFFLINE'}\n"
        f"{match_summary + '💡' if api_online else ''}\n"
        f"🔑 *API Key AI:* {'🟢 Đã cấu hình' if GEMINI_API_KEY else '🔴 Chưa cấu hình'}\n"
        f"💻 *Kết nối IDE Agent:* {f'🔗 Đang đồng bộ (`{conv_id[:8]}...`)' if sync_enabled else '📴 Chế độ Heo Hồng Chatbot'}\n"
        f"⏰ Thời gian check: {datetime.now().strftime('%H:%M:%S')}"
    )
    send_message(chat_id, status_msg)


# ══════════════════════════════════════════════════
# TELEGRAM <-> IDE AGENT SYNC CONFIGURATION
# ══════════════════════════════════════════════════
SYNC_CONFIG_FILE = os.path.join(SCRIPT_DIR, ".telegram_sync.json")

active_continuous_polls = {}
stop_events = {}
last_sent_from_telegram = {}
active_polls = {}

def load_sync_config() -> dict:
    if os.path.exists(SYNC_CONFIG_FILE):
        try:
            with open(SYNC_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Lỗi đọc file sync config: {e}")
    return {}

def save_sync_config(config: dict):
    try:
        with open(SYNC_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Lỗi ghi file sync config: {e}")

def get_sync_chat_id() -> Optional[int]:
    config = load_sync_config()
    if config.get("sync_enabled"):
        return config.get("chat_id")
    return None

def is_sync_enabled(chat_id: int) -> bool:
    config = load_sync_config()
    return config.get("sync_enabled", False) and config.get("chat_id") == chat_id

def get_current_conversation_id() -> Optional[str]:
    try:
        config_path = os.path.join(SCRIPT_DIR, ".conversation_id")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                return f.read().strip()
    except Exception as e:
        logger.error(f"Lỗi đọc .conversation_id: {e}")
    return None

def get_latest_step_index(conversation_id: str) -> int:
    transcript_path = f"/Users/tonguyen/.gemini/antigravity-ide/brain/{conversation_id}/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(transcript_path):
        return 0
    max_idx = 0
    try:
        with open(transcript_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    step = json.loads(line)
                    idx = step.get("step_index", 0)
                    if idx > max_idx:
                        max_idx = idx
                except:
                    pass
    except Exception as e:
        logger.error(f"Lỗi đọc step_index: {e}")
    return max_idx

def start_continuous_polling(chat_id: int):
    if chat_id in active_continuous_polls:
        thread = active_continuous_polls[chat_id]
        if thread.is_alive():
            logger.info(f"Thread continuous polling cho chat {chat_id} đang chạy rồi.")
            return
            
    logger.info(f"Khởi chạy thread continuous polling mới cho chat {chat_id}")
    stop_event = threading.Event()
    stop_events[chat_id] = stop_event
    stop_event.clear()
    
    thread = threading.Thread(
        target=poll_agent_continuous_loop,
        args=(chat_id, stop_event),
        daemon=True
    )
    active_continuous_polls[chat_id] = thread
    thread.start()

def stop_continuous_polling(chat_id: int):
    if chat_id in stop_events:
        logger.info(f"Dừng thread continuous polling cho chat {chat_id}")
        stop_events[chat_id].set()
        stop_events.pop(chat_id, None)
        active_continuous_polls.pop(chat_id, None)

def poll_agent_continuous_loop(chat_id: int, stop_event: threading.Event):
    logger.info(f"Bắt đầu vòng lặp poll continuous cho chat_id {chat_id}")
    
    last_conv_id = None
    last_idx = 0
    last_offset = 0
    
    current_conv_id = get_current_conversation_id()
    if current_conv_id:
        last_conv_id = current_conv_id
        last_idx = get_latest_step_index(current_conv_id)
        logger.info(f"Khởi tạo continuous poll cho conv {current_conv_id} tại step {last_idx}")
        
    while not stop_event.is_set():
        current_conv_id = get_current_conversation_id()
        if not current_conv_id:
            time.sleep(2)
            continue
            
        if current_conv_id != last_conv_id:
            last_conv_id = current_conv_id
            last_idx = get_latest_step_index(current_conv_id)
            last_offset = 0
            send_message(
                chat_id, 
                f"🔄 *Đã tự động chuyển đồng bộ sang Conversation mới:*\n`{current_conv_id}`"
            )
            logger.info(f"Chuyển continuous poll sang conv {current_conv_id} tại step {last_idx}")
            
        transcript_path = f"/Users/tonguyen/.gemini/antigravity-ide/brain/{current_conv_id}/.system_generated/logs/transcript.jsonl"
        if not os.path.exists(transcript_path):
            last_offset = 0
            time.sleep(2)
            continue
            
        try:
            file_size = os.path.getsize(transcript_path)
            if file_size < last_offset:
                last_offset = 0
            if file_size == last_offset:
                time.sleep(1.5)
                continue
        except Exception as e:
            logger.error(f"Lỗi check size file transcript: {e}")
            time.sleep(2)
            continue
            
        new_lines = []
        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                f.seek(last_offset)
                content = f.read()
                last_offset = f.tell()
                for line in content.split("\n"):
                    if not line.strip():
                        continue
                    try:
                        step = json.loads(line)
                        idx = step.get("step_index", 0)
                        if idx > last_idx:
                            new_lines.append(step)
                    except:
                        pass
        except Exception as e:
            logger.error(f"Lỗi đọc file transcript trong continuous loop: {e}")
            time.sleep(2)
            continue
            
        if new_lines:
            for step in new_lines:
                idx = step.get("step_index", 0)
                last_idx = max(last_idx, idx)
                
                step_type = step.get("type")
                source = step.get("source")
                content = step.get("content", "").strip()
                
                if step_type == "USER_INPUT":
                    sent_msgs = last_sent_from_telegram.get(chat_id, [])
                    if content in sent_msgs:
                        sent_msgs.remove(content)
                        last_sent_from_telegram[chat_id] = sent_msgs
                        continue
                    send_message(chat_id, f"👤 *User (IDE):*\n{content}")
                    
                elif step_type == "PLANNER_RESPONSE" and source == "MODEL":
                    tool_calls = step.get("tool_calls", [])
                    if content:
                        send_message(chat_id, f"🤖 *IDE Agent:*\n\n{content}")
                    if tool_calls:
                        for tc in tool_calls:
                            name = tc.get("name", "tool")
                            args = tc.get("args", {})
                            summary = args.get("toolSummary", "") or args.get("toolAction", "") or name
                            summary = summary.strip('"\'')
                            send_message(chat_id, f"🛠️ *Agent đang thực thi:* `{summary}`")
                            
                elif step_type == "ASK_QUESTION":
                    send_message(chat_id, f"❓ *IDE Agent cần anh xác nhận (vui lòng vào IDE hoặc chat trực tiếp tại đây để trả lời):*\n\n{content}")
                    
                elif step_type == "ERROR_MESSAGE":
                    send_message(chat_id, f"❌ *IDE Agent gặp lỗi:* `{content}`")
                    
        time.sleep(1.5)

def poll_agent_response(chat_id: int, conversation_id: str, start_step_index: int):
    transcript_path = f"/Users/tonguyen/.gemini/antigravity-ide/brain/{conversation_id}/.system_generated/logs/transcript.jsonl"
    logger.info(f"Bắt đầu poll transcript cho conv {conversation_id} từ step_index {start_step_index}")
    
    last_idx = start_step_index
    no_update_count = 0
    max_no_update = 240
    active_polls[chat_id] = True
    last_offset = 0
    
    try:
        while active_polls.get(chat_id):
            if not os.path.exists(transcript_path):
                time.sleep(2)
                continue
                
            try:
                file_size = os.path.getsize(transcript_path)
                if file_size < last_offset:
                    last_offset = 0
                if file_size == last_offset:
                    no_update_count += 1
                    if no_update_count > max_no_update:
                        send_message(chat_id, "⚠️ *Thời gian chờ IDE Agent phản hồi quá lâu (Timeout 6 phút).*")
                        active_polls[chat_id] = False
                        return
                    time.sleep(1.5)
                    continue
            except Exception as e:
                logger.error(f"Lỗi check size file transcript: {e}")
                time.sleep(2)
                continue
                
            new_lines = []
            try:
                with open(transcript_path, "r", encoding="utf-8") as f:
                    f.seek(last_offset)
                    content = f.read()
                    last_offset = f.tell()
                    for line in content.split("\n"):
                        if not line.strip():
                            continue
                        try:
                            step = json.loads(line)
                            idx = step.get("step_index", 0)
                            if idx > last_idx:
                                new_lines.append(step)
                        except:
                            pass
            except Exception as e:
                logger.error(f"Lỗi đọc file transcript: {e}")
                time.sleep(2)
                continue
                
            if new_lines:
                no_update_count = 0
                for step in new_lines:
                    idx = step.get("step_index", 0)
                    last_idx = max(last_idx, idx)
                    
                    step_type = step.get("type")
                    source = step.get("source")
                    
                    if step_type == "PLANNER_RESPONSE" and source == "MODEL":
                        content = step.get("content", "").strip()
                        tool_calls = step.get("tool_calls", [])
                        
                        if content:
                            send_message(chat_id, f"🤖 *IDE Agent:*\n\n{content}")
                            
                        if tool_calls:
                            for tc in tool_calls:
                                name = tc.get("name", "tool")
                                args = tc.get("args", {})
                                summary = args.get("toolSummary", "") or args.get("toolAction", "") or name
                                summary = summary.strip('"\'')
                                send_message(chat_id, f"🛠️ *Agent đang thực thi:* `{summary}`")
                        
                        if not tool_calls:
                            send_message(chat_id, "✅ *IDE Agent đã hoàn thành lượt xử lý.*")
                            active_polls[chat_id] = False
                            return
                            
                    elif step_type == "ASK_QUESTION":
                        content = step.get("content", "").strip()
                        send_message(chat_id, f"❓ *IDE Agent cần anh xác nhận (vui lòng vào IDE để trả lời):*\n\n{content}")
                        active_polls[chat_id] = False
                        return
                        
                    elif step_type == "ERROR_MESSAGE":
                        content = step.get("content", "").strip()
                        send_message(chat_id, f"❌ *IDE Agent gặp lỗi:* `{content}`")
                        active_polls[chat_id] = False
                        return
            time.sleep(1.5)
    except Exception as e:
        logger.error(f"Lỗi trong luồng poll agent: {e}")
        send_message(chat_id, f"⚠️ Gặp sự cố khi theo dõi phản hồi của Agent: {str(e)}")
    finally:
        active_polls[chat_id] = False

def send_message_to_agent(chat_id: int, command_text: str) -> bool:
    conversation_id = get_current_conversation_id()
    if not conversation_id:
        send_message(chat_id, "❌ Không tìm thấy `.conversation_id` hiện tại.")
        return False
        
    agentapi_path = "/Users/tonguyen/.gemini/antigravity-ide/bin/agentapi"
    try:
        result = subprocess.run(
            [agentapi_path, "send-message", conversation_id, command_text],
            capture_output=True,
            text=True,
            timeout=15
        )
        if result.returncode != 0:
            send_message(chat_id, f"❌ Lỗi gửi lệnh đến Agent: {result.stderr or result.stdout}")
            return False
        return True
    except Exception as e:
        send_message(chat_id, f"❌ Lỗi thực thi agentapi: {str(e)}")
        return False

def handle_agent_command(chat_id: int, command_text: str):
    if not command_text:
        send_message(chat_id, "💻 Cú pháp: `/agent [lệnh]`\nVí dụ: `/agent viết test case cho chatbot.py`")
        return
        
    if active_polls.get(chat_id):
        send_message(chat_id, "⏳ Agent vẫn đang thực thi lệnh trước. Vui lòng đợi đến khi hoàn thành.")
        return
        
    conversation_id = get_current_conversation_id()
    if not conversation_id:
        send_message(chat_id, "❌ Không tìm thấy file `.conversation_id` hiện tại.")
        return
        
    start_step_index = get_latest_step_index(conversation_id)
    send_message(chat_id, f"📥 *Đang gửi lệnh đến IDE Agent...*\n💬 *Lệnh:* _{command_text}_")
    
    if send_message_to_agent(chat_id, command_text):
        t = threading.Thread(
            target=poll_agent_response,
            args=(chat_id, conversation_id, start_step_index),
            daemon=True
        )
        t.start()

def handle_sync_command(chat_id: int, text: str):
    args = text[5:].strip().lower()
    
    if args == "off":
        if is_sync_enabled(chat_id):
            stop_continuous_polling(chat_id)
            save_sync_config({"sync_enabled": False, "chat_id": None})
            send_message(chat_id, "📴 *Đã tắt đồng bộ hóa với IDE Agent.*\nBot quay lại chế độ Heo Hồng 🐷 chat trực tiếp.")
        else:
            send_message(chat_id, "ℹ️ Đồng bộ hóa vốn đang ở trạng thái tắt.")
    else:
        current_conv_id = get_current_conversation_id()
        if not current_conv_id:
            send_message(chat_id, "❌ Không tìm thấy `.conversation_id`. Cần bắt đầu chat trong IDE trước.")
            return
            
        save_sync_config({
            "sync_enabled": True,
            "chat_id": chat_id,
            "conversation_id": current_conv_id
        })
        start_continuous_polling(chat_id)
        send_message(
            chat_id, 
            f"🔗 *Đã bật đồng bộ hóa 2 chiều với IDE Agent!*\n"
            f"Conversation ID: `{current_conv_id}`\n\n"
            f"👉 Mọi tin nhắn gửi cho bot bây giờ sẽ được tự động chuyển trực tiếp vào ô chat IDE mà không cần gõ tiền tố `/agent`.\n"
            f"👉 Để tắt đồng bộ, hãy gõ `/sync off`."
        )


# ══════════════════════════════════════════════════
# MAIN POLLING LOOP
# ══════════════════════════════════════════════════
def process_update(update: dict):
    msg = update.get("message")
    if not msg:
        return
    
    chat_id = msg["chat"]["id"]
    user_id = msg["from"]["id"]
    user_name = msg["from"].get("first_name", "User")
    text = msg.get("text", "").strip()
    message_id = msg["message_id"]
    
    if not text:
        return
    
    logger.info(f"[{user_id}] @{msg['from'].get('username', 'N/A')}: {text[:100]}")
    
    # Commands
    if text.startswith("/start"):
        handle_start(chat_id, user_name)
    elif text.startswith("/help"):
        handle_help(chat_id)
    elif text.startswith("/status"):
        handle_status(chat_id)
    elif text.startswith("/agent"):
        command_text = text[6:].strip()
        handle_agent_command(chat_id, command_text)
    elif text.startswith("/sync"):
        handle_sync_command(chat_id, text)
    else:
        # If sync enabled
        if is_sync_enabled(chat_id):
            if chat_id not in last_sent_from_telegram:
                last_sent_from_telegram[chat_id] = []
            last_sent_from_telegram[chat_id].append(text)
            send_message_to_agent(chat_id, text)
        else:
            # General chatbot - Heo Hồng AI chat
            send_typing(chat_id)
            reply = call_heohong_chat(chat_id, text)
            send_message(chat_id, reply, parse_mode="HTML", reply_to=message_id)


_lock_socket = None

def ensure_single_instance(port: int = PORT_SOCKET_LOCK):
    import socket
    global _lock_socket
    try:
        _lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        _lock_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        _lock_socket.bind(('127.0.0.1', port))
        _lock_socket.listen(1)
        logger.info(f"Đã thiết lập socket lock trên cổng {port} thành công.")
    except socket.error:
        logger.error(f"❌ Lỗi: Tiến trình bot khác đang chiếm cổng {port}.")
        print(f"\n❌ Lỗi: Một tiến trình bot khác đang chạy hoặc cổng {port} đang bận!")
        sys.exit(1)

def main():
    ensure_single_instance()
    print("=" * 60)
    print("🐷  Heo Hồng WC2026 Telegram Bot — Trợ lý AI")
    print("=" * 60)
    
    # Check Telegram connection
    me = tg_request("getMe")
    if me.get("ok"):
        bot_info = me["result"]
        print(f"✅ Bot: @{bot_info['username']} ({bot_info['first_name']})")
    else:
        print(f"❌ Không thể kết nối Telegram: {me}")
        sys.exit(1)
        
    print()
    print("📱 Mở Telegram và chat với @" + bot_info["username"])
    print("   Nhấn Ctrl+C để dừng bot.")
    print("=" * 60)
    
    # Set bot commands
    tg_request("setMyCommands", {
        "commands": [
            {"command": "start", "description": "🏠 Bắt đầu — Chào mừng Heo Hồng"},
            {"command": "help", "description": "📖 Hướng dẫn sử dụng chi tiết"},
            {"command": "sync", "description": "🔗 Đồng bộ 2 chiều trực tiếp với IDE Agent"},
            {"command": "status", "description": "📊 Trạng thái giải đấu & kết nối IDE"},
            {"command": "agent", "description": "💻 Ra lệnh cho AI Agent trong IDE"}
        ]
    })
    
    # Restore sync if enabled
    sync_config = load_sync_config()
    if sync_config.get("sync_enabled") and sync_config.get("chat_id"):
        chat_id = sync_config["chat_id"]
        print(f"🔄 Khôi phục đồng bộ liên tục với chat_id: {chat_id}")
        start_continuous_polling(chat_id)
        
    offset = 0
    error_count = 0
    
    while True:
        try:
            result = tg_request("getUpdates", {
                "offset": offset,
                "timeout": 30,
                "allowed_updates": ["message"]
            }, timeout=35)
            
            if result.get("ok"):
                error_count = 0
                for update in result.get("result", []):
                    offset = update["update_id"] + 1
                    try:
                        process_update(update)
                    except Exception as e:
                        logger.error(f"Error processing update: {e}", exc_info=True)
            else:
                error_count += 1
                logger.warning(f"getUpdates failed (attempt {error_count})")
                time.sleep(min(error_count * 2, 30))
                
        except KeyboardInterrupt:
            print("\n🛑 Bot stopped by user.")
            break
        except Exception as e:
            error_count += 1
            logger.error(f"Polling error: {e}", exc_info=True)
            time.sleep(min(error_count * 2, 30))

if __name__ == "__main__":
    main()
