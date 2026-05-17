import React, { useEffect, useState } from 'react';
import { askChatbot } from '../../../services/api/PostManagementService';
import type { ChatbotSuggestionDTO } from '../../../services/api/PostManagementService';
import { AUTH_SESSION_CLEARED_EVENT } from '../../../utils/storage';
import './ChatBox.css';

interface ChatMessage {
  role: 'USER' | 'BOT';
  content: string;
  suggestions?: ChatbotSuggestionDTO[];
}

const CHATBOT_HISTORY_KEY = 'chatbot_history';
const CHATBOT_HISTORY_TTL = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: 'BOT',
    content:
      'Xin chào! Bạn có thể hỏi mình về thuê căn hộ hoặc tư vấn giá cho thuê.',
  },
];

const getInitialMessages = () => {
  const saved = localStorage.getItem(CHATBOT_HISTORY_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (Date.now() - parsed.createdAt < CHATBOT_HISTORY_TTL) {
        return parsed.messages;
      }

      localStorage.removeItem(CHATBOT_HISTORY_KEY);
    } catch {
      localStorage.removeItem(CHATBOT_HISTORY_KEY);
    }
  }

  return DEFAULT_MESSAGES;
};

const ChatbotBox: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);

  useEffect(() => {
    localStorage.setItem(
      CHATBOT_HISTORY_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        messages,
      }),
    );
  }, [messages]);

  useEffect(() => {
    const resetChatHistory = () => {
      setOpen(false);
      setMessage('');
      setLoading(false);
      setMessages(DEFAULT_MESSAGES);
    };

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, resetChatHistory);

    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, resetChatHistory);
    };
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: 'USER',
        content: userMessage,
      },
    ]);

    setMessage('');
    setLoading(true);

    try {
      const maNguoiDung =
        localStorage.getItem('maNguoiDung') ||
        localStorage.getItem('userId') ||
        undefined;

      const res = await askChatbot({
        maNguoiDung,
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'BOT',
          content: res.answer,
          suggestions: res.suggestions,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'BOT',
          content: 'Xin lỗi, hiện tại mình chưa xử lý được yêu cầu này.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chatbot-floating-btn" onClick={() => setOpen(true)}>
        💬
      </button>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <strong>AI Chatbot</strong>
              <span>Tư vấn thuê & cho thuê căn hộ</span>
            </div>

            <button onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chatbot-body">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`chatbot-message ${item.role === 'USER' ? 'user' : 'bot'
                  }`}
              >
                <div className="chatbot-bubble">
                  <p>{item.content}</p>

                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="chatbot-suggestions">
                      {item.suggestions.map((s) => (
                        <a
                          key={s.maBaiDang}
                          href={s.link || `/listing/${s.maBaiDang}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chatbot-suggestion-card"
                        >
                          <strong>{s.tieuDe}</strong>

                          <span>
                            {s.gia
                              ? `${s.gia.toLocaleString('vi-VN')}đ/tháng`
                              : 'Liên hệ'}
                          </span>

                          <small>
                            {s.diaChi || s.phuong || 'Đà Nẵng'}
                          </small>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-message bot">
                <div className="chatbot-bubble">
                  <p>Đang tìm dữ liệu phù hợp...</p>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button onClick={handleSend} disabled={loading}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotBox;
