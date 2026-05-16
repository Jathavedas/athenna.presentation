import React from 'react';
import ReactMarkdown from 'react-markdown';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-container ${isUser ? 'user-container' : 'athena-container'}`}>
      <div className="message-content hud-panel">
        <div className="corner-tr"></div>
        <div className="corner-bl"></div>
        
        <div className="message-header text-mono">
          <span className="sender">{isUser ? '> USER_DIRECTIVE' : '> A.T.H.E.N.A_RESPONSE'}</span>
          <span className="timestamp">T-MINUS {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
        
        <div className={`message-body ${isUser ? 'user-message' : 'athena-message'}`}>
          {isUser ? (
            <p className="text-cyan text-mono" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{message.content}</p>
          ) : (
            <div className="markdown-body text-mono">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .message-container {
          display: flex;
          width: 100%;
          margin-bottom: 25px;
          justify-content: ${isUser ? 'flex-end' : 'flex-start'};
        }
        .message-content {
          max-width: 85%;
          padding: 15px 20px;
          border-left: ${isUser ? '1px solid var(--hud-cyan-dim)' : '3px solid var(--hud-cyan)'};
          border-right: ${isUser ? '3px solid var(--hud-blue)' : '1px solid var(--hud-cyan-dim)'};
          background: ${isUser ? 'rgba(0, 15, 30, 0.4)' : 'rgba(0, 30, 40, 0.5)'};
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--hud-cyan-dim);
          border-bottom: 1px solid rgba(0, 240, 255, 0.15);
          padding-bottom: 8px;
          margin-bottom: 12px;
          gap: 20px;
        }
        .sender {
          color: ${isUser ? 'var(--hud-blue)' : 'var(--hud-cyan)'};
          text-shadow: 0 0 8px ${isUser ? 'var(--hud-blue-glow)' : 'var(--hud-cyan-glow)'};
          font-weight: bold;
        }
        .message-body {
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .user-message p {
          color: var(--hud-blue);
          text-shadow: 0 0 5px rgba(0, 120, 255, 0.5);
        }
        .markdown-body p { margin-bottom: 12px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { color: #fff; text-shadow: 0 0 8px #fff; letter-spacing: 2px; }
        .markdown-body code { color: var(--hud-warning); background: rgba(255, 180, 0, 0.1); padding: 2px 6px; border: 1px solid rgba(255, 180, 0, 0.3); }
        .markdown-body pre { border: 1px solid var(--hud-cyan-dim); padding: 15px; background: rgba(0,0,0,0.7); overflow-x: auto; margin: 10px 0; box-shadow: inset 0 0 10px rgba(0,0,0,0.8); }
        .markdown-body ul, .markdown-body ol { margin-left: 20px; margin-bottom: 12px; }
        .markdown-body li { margin-bottom: 5px; }

        /* --- RESPONSIVE PROTOCOLS --- */
        @media (max-width: 768px) {
          .message-content {
            max-width: 95%;
            padding: 10px 12px;
          }
          .message-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            font-size: 0.75rem;
          }
          .message-body {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
