import React, { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function InputArea({ onSendMessage, isProcessing }) {
  const [input, setInput] = useState('');
  const sessionPrefixRef = useRef('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sessionPrefixRef.current = e.target.value;
  };

  const handleTranscript = ({ finalTranscript, interimTranscript }) => {
    const prefix = sessionPrefixRef.current ? sessionPrefixRef.current + ' ' : '';
    setInput(prefix + finalTranscript + interimTranscript);
  };

  const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript);

  const handleToggleMic = () => {
    if (!isListening) {
      sessionPrefixRef.current = input;
    }
    toggleListening();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim());
    setInput('');
    sessionPrefixRef.current = '';
  };

  return (
    <div className="input-wrapper hud-panel">
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>

      <div className="input-header text-mono">
        <span className="text-blue">SYS.COM // DIRECTIVE_INPUT</span>
        <span className={isListening ? 'mic-status active' : 'mic-status'}>
          {isListening ? '[ UPLINK: ACTIVE ]' : '[ UPLINK: STANDBY ]'}
        </span>
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <button 
          type="button" 
          onClick={handleToggleMic}
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          disabled={!isSupported || isProcessing}
        >
          <div className="mic-core"></div>
        </button>
        
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isListening ? "TRANSMITTING AUDIO SIGNAL..." : "ENTER COMMAND DIRECTIVE..."}
          className="command-input text-mono text-cyan"
          disabled={isProcessing}
          autoFocus
        />
        
        <button 
          type="submit" 
          className="send-btn text-mono"
          disabled={!input.trim() || isProcessing}
        >
          EXECUTE
        </button>
      </form>

      <style>{`
        .input-wrapper {
          width: 100%;
          padding: 15px 20px;
        }
        .input-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--hud-cyan-dim);
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(0, 120, 255, 0.3);
          padding-bottom: 8px;
          letter-spacing: 2px;
        }
        .mic-status.active { color: var(--hud-alert); text-shadow: 0 0 8px var(--hud-alert); animation: flicker 1s infinite; }
        
        .input-form {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .mic-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          padding: 0;
          background: transparent;
          border: 1px solid var(--hud-cyan);
          cursor: pointer;
        }
        .mic-core {
          width: 14px; height: 14px;
          background: var(--hud-cyan);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--hud-cyan-glow);
          transition: all 0.2s;
        }
        .mic-btn.listening {
          border-color: var(--hud-alert);
          box-shadow: 0 0 15px rgba(255, 50, 50, 0.4);
          animation: spin 2s linear infinite;
        }
        .mic-btn.listening .mic-core {
          background: var(--hud-alert);
          box-shadow: 0 0 15px var(--hud-alert);
        }

        .command-input {
          flex: 1;
          background: rgba(0,0,0,0.6);
          border: 1px solid var(--hud-cyan-dim);
          color: var(--hud-cyan);
          font-size: 1.1rem;
          padding: 12px 15px;
          text-transform: uppercase;
          box-shadow: inset 0 0 15px rgba(0, 240, 255, 0.05);
          transition: all 0.3s ease;
        }
        .command-input:focus {
          outline: none;
          border-color: var(--hud-cyan);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2), inset 0 0 10px rgba(0, 240, 255, 0.1);
        }
        .command-input::placeholder {
          color: rgba(0, 240, 255, 0.3);
          letter-spacing: 1px;
        }
        
        .send-btn {
          background: rgba(0, 120, 255, 0.1);
          border: 1px solid var(--hud-blue);
          cursor: pointer;
          color: var(--hud-blue);
          padding: 12px 25px;
          font-weight: bold;
          letter-spacing: 2px;
          transition: all 0.2s ease;
        }
        .send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          border-color: var(--hud-cyan-dim);
          color: var(--hud-cyan-dim);
          background: transparent;
        }
        .send-btn:not(:disabled):hover {
          background: rgba(0, 120, 255, 0.3);
          box-shadow: 0 0 15px var(--hud-blue-glow);
          color: #fff;
        }

        /* --- RESPONSIVE PROTOCOLS --- */
        @media (max-width: 768px) {
          .input-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          .input-form {
            flex-wrap: nowrap;
            gap: 8px;
          }
          .command-input {
            font-size: 0.9rem;
            padding: 10px 12px;
            min-width: 0; /* Prevents flex item from overflowing */
          }
          .mic-btn {
            width: 38px; height: 38px;
            flex-shrink: 0;
          }
          .send-btn {
            padding: 10px 15px;
            font-size: 0.85rem;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}
