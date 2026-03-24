import { useEffect, useRef, useState } from "react";

const AGENT_URL = import.meta.env.VITE_AGENT_URL || "http://localhost:8000/agent/chat";

const SUGGESTIONS = [
  "Which location had the highest average AQHI?",
  "How many Very High category records are there?",
  "Compare average AQHI for Forecast vs Observation.",
  "What hour of the day has the worst air quality?",
];

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text) {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch(AGENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer || data.detail || "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: could not reach the agent. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return (
    <>
      <button
        className="aqhi-chat-fab"
        onClick={() => setOpen((current) => !current)}
        title="Ask AI about AQHI data"
        style={styles.fab}
      >
        {open ? "X" : "Ask AQHI"}
      </button>

      {open && (
        <div className="aqhi-chat-panel" style={styles.panel}>
          <div style={styles.header}>
            <div>
              <div style={styles.headerTitle}>AQHI Assistant</div>
              <div style={styles.headerSub}>
                Ask about locations, trends, categories, and hourly AQHI patterns.
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>
              X
            </button>
          </div>

          <div style={styles.messages}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>AQHI</div>
                <p style={styles.emptyText}>Ask a question about the current AQHI dataset.</p>
                <div style={styles.suggestions}>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      style={styles.chip}
                      onClick={() => send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 12,
                }}
              >
                {message.role === "assistant" && <div style={styles.avatar}>AI</div>}
                <div style={message.role === "user" ? styles.userBubble : styles.aiBubble}>
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={styles.avatar}>AI</div>
                <div style={{ ...styles.aiBubble, ...styles.typing }}>
                  <span style={styles.dot} />
                  <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                  <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={styles.inputRow}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question about AQHI data"
              rows={1}
              style={styles.textarea}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{ ...styles.sendBtn, opacity: !input.trim() || loading ? 0.45 : 1 }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}

const styles = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0f766e, #0ea5a4)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(14, 116, 144, 0.2)",
    transition: "all 0.2s ease",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "fixed",
    bottom: 96,
    right: 28,
    width: 388,
    maxWidth: "calc(100vw - 40px)",
    height: 540,
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(18px)",
    borderRadius: 22,
    boxShadow: "0 24px 56px rgba(15, 23, 42, 0.18)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "flex",
    flexDirection: "column",
    zIndex: 999,
    overflow: "hidden",
  },
  header: {
    background: "linear-gradient(135deg, #f0fdfa, #ecfeff)",
    padding: "16px 18px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#0f172a",
    flexShrink: 0,
    borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 16,
  },
  headerSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 1.4,
  },
  closeBtn: {
    background: "#ffffff",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: 13,
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
  },
  emptyState: {
    textAlign: "center",
    marginTop: 12,
    flex: 1,
  },
  emptyIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 74,
    height: 36,
    borderRadius: 999,
    background: "#e6fffb",
    color: "#0f766e",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 14,
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "stretch",
  },
  chip: {
    background: "#f8fbff",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    color: "#0f172a",
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.45,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0f766e, #0ea5a4)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  userBubble: {
    background: "#0f766e",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: 13,
    maxWidth: "78%",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    boxShadow: "0 8px 20px rgba(15, 118, 110, 0.14)",
  },
  aiBubble: {
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: 13,
    maxWidth: "78%",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    border: "1px solid rgba(148, 163, 184, 0.16)",
  },
  typing: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    padding: "10px 14px",
  },
  dot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#0f766e",
    animation: "bounce 1.2s infinite ease-in-out",
  },
  inputRow: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid #e8edf5",
    background: "#f8fafc",
    flexShrink: 0,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1px solid #d0d8e8",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: "\"Segoe UI\", sans-serif",
    outline: "none",
    lineHeight: 1.5,
    background: "#fff",
  },
  sendBtn: {
    minWidth: 64,
    height: 40,
    borderRadius: 10,
    background: "#0f766e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.15s",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

if (typeof document !== "undefined" && !document.getElementById("aqhi-chat-mobile-style")) {
  const styleTag = document.createElement("style");
  styleTag.id = "aqhi-chat-mobile-style";
  styleTag.textContent = `
    @media (max-width: 640px) {
      .aqhi-chat-panel {
        right: 12px !important;
        left: 12px !important;
        bottom: 84px !important;
        width: auto !important;
        height: min(72vh, 560px) !important;
      }

      .aqhi-chat-fab {
        right: 16px !important;
        bottom: 16px !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
