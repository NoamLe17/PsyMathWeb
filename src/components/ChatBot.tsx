"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Send, Sparkles, MessageCircle, Loader2,
  ChevronDown, Zap, BookOpen, Map, ShoppingCart, Dumbbell
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Parse **bold** markdown
function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) {
      return <strong key={i} className="font-bold">{boldMatch[1]}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Convert markdown links [text](url) to anchor tags
function parseLinks(text: string): React.ReactNode[] {
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return parts.flatMap((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (match) {
      return [
        <a key={i} href={match[2]} className="chatbot-link">
          {match[1]}
        </a>,
      ];
    }
    return parseBold(part).map((node, j) =>
      typeof node === "string" ? <span key={`${i}-${j}`}>{node}</span> : { ...node as React.ReactElement, key: `${i}-${j}` }
    );
  });
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chatbot-message-content">
      {content.split("\n").map((line, idx) => (
        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
          {parseLinks(line)}
        </p>
      ))}
    </div>
  );
}

const QUICK_REPLIES = [
  { label: "🎯 איפה הסימולציות?", text: "איפה נמצאות הסימולציות?", icon: Map },
  { label: "🧮 עזרה בשאלה", text: "אני רוצה עזרה בפתרון שאלה כמותית", icon: BookOpen },
  { label: "🛒 קניית קורס", text: "איך אני קונה קורס? איפה הקטלוג?", icon: ShoppingCart },
  { label: "💪 תרגול עצמאי", text: "איפה אני יכול לתרגל שאלות בעצמי?", icon: Dumbbell },
];

const GREETING = `היי! אני **אלפא**, העוזר החכם של כמותיקס.

יכול לעזור לך:
• **ללמוד** — לפתור שאלות ולהסביר נושאים
• **לנווט** — למצוא סימולציות, קורסים ועוד

מה נעשה היום? 🚀`;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: GREETING,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
    setIsMinimized(false);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const allMessages = [...messages, userMessage].filter(m => m.id !== "greeting");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || data.error || "אירעה שגיאה, נסה שוב.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "נראה שיש בעיית חיבור 🙏 נסה שוב בעוד רגע.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const showQuickReplies = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          id="chatbot-toggle-btn"
          aria-label="פתח עוזר לימוד"
          className="chatbot-fab"
        >
          <div className="chatbot-fab-inner">
            <Zap size={24} strokeWidth={2} />
          </div>
          {hasUnread && (
            <span className="chatbot-fab-badge">
              <Sparkles size={9} />
            </span>
          )}
          <div className="chatbot-fab-ripple" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? "chatbot-window--minimized" : ""}`}>

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-header-avatar">
                <Zap size={17} strokeWidth={2.2} />
              </div>
              <div className="chatbot-header-info">
                <div className="chatbot-header-name-row">
                  <span className="chatbot-header-name">אלפא</span>
                  <span className="chatbot-header-online">
                    <span className="chatbot-header-dot" />
                  </span>
                </div>
                <span className="chatbot-header-subtitle">עוזר הלמידה של כמותיקס</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                onClick={() => setIsMinimized(v => !v)}
                className="chatbot-icon-btn"
                aria-label={isMinimized ? "הרחב" : "מזער"}
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: isMinimized ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease"
                  }}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-icon-btn"
                aria-label="סגור"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-messages" id="chatbot-messages-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chatbot-message-row ${msg.role === "user" ? "chatbot-message-row--user" : "chatbot-message-row--bot"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="chatbot-bot-avatar">
                        <Zap size={13} strokeWidth={2.2} />
                      </div>
                    )}
                    <div className={`chatbot-bubble ${msg.role === "user" ? "chatbot-bubble--user" : "chatbot-bubble--bot"}`}>
                      <MessageContent content={msg.content} />
                    </div>
                    {msg.role === "user" && (
                      <div className="chatbot-user-avatar">
                        <span>א</span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="chatbot-message-row chatbot-message-row--bot">
                    <div className="chatbot-bot-avatar">
                      <Zap size={13} strokeWidth={2.2} />
                    </div>
                    <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {showQuickReplies && (
                <div className="chatbot-quick-replies">
                  <p className="chatbot-quick-replies-label">שאלות מהירות:</p>
                  <div className="chatbot-quick-replies-grid">
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr.label}
                        onClick={() => sendMessage(qr.text)}
                        className="chatbot-quick-reply-btn"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="chatbot-input-area">
                <div className="chatbot-input-wrapper">
                  <textarea
                    ref={inputRef}
                    id="chatbot-input"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="שאל אותי כל דבר..."
                    rows={1}
                    className="chatbot-textarea"
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="chatbot-send-btn"
                    aria-label="שלח"
                    id="chatbot-send-btn"
                  >
                    {isLoading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>
                <div className="chatbot-footer-hint">
                  <MessageCircle size={10} />
                  <span>Enter לשליחה • Shift+Enter לשורה חדשה</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
