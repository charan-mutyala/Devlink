import { useState, useEffect } from "react";
import { aiApi } from "../api";

export default function AITips({ onClose }) {
  const [tips, setTips] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    aiApi.getTips()
      .then((d) => setTips(d.tips))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function sendChat() {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);
    try {
      const data = await aiApi.chat(newMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error reaching AI. Try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">AI Career Coach</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ai-tips-body">
          <div className="tips-section">
            <div className="tips-label">Resume tips based on your profile</div>
            {loading && <div className="tips-loading">Analyzing your profile...</div>}
            {error && <div className="form-error">{error}</div>}
            {tips && (
              <div className="tips-content">
                {tips.split("\n").map((line, i) => (
                  <p key={i} className={line.match(/^\d\./) ? "tip-item" : "tip-text"}>{line}</p>
                ))}
              </div>
            )}
          </div>

          <div className="chat-section">
            <div className="tips-label">Ask the AI anything</div>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-placeholder">Ask about interview prep, salary negotiation, resume wording...</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role === "user" ? "chat-msg-user" : "chat-msg-ai"}`}>
                  <div className="chat-msg-label">{m.role === "user" ? "You" : "AI"}</div>
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg chat-msg-ai">
                  <div className="chat-msg-label">AI</div>
                  <span className="typing-dots">...</span>
                </div>
              )}
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              />
              <button className="btn-primary" onClick={sendChat} disabled={chatLoading || !input.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
