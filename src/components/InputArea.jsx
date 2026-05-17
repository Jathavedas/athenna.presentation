import React, { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function InputArea({ onSendMessage, isProcessing, isSpeaking }) {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en-US');
  const sessionPrefixRef = useRef('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isListening) {
      sessionPrefixRef.current = e.target.value;
    }
  };

  const submitTimeoutRef = useRef(null);

  const handleTranscript = ({ finalTranscript, interimTranscript }) => {
    const currentSegment = (finalTranscript + ' ' + interimTranscript).toLowerCase().trim();
    
    // Command: LANGUAGE SWITCH
    if (/(switch to malayalam|change to malayalam|malayalam input|speak malayalam|മലയാളം|മലയാളത്തിലേക്ക്)/.test(currentSegment)) {
      setLanguage('ml-IN');
      setInput('');
      sessionPrefixRef.current = '';
      return; 
    }
    
    if (/(switch to english|change to english|english input|speak english|ഇംഗ്ലീഷ്|ഇംഗ്ലീഷിലേക്ക്)/.test(currentSegment)) {
      setLanguage('en-US');
      setInput('');
      sessionPrefixRef.current = '';
      return;
    }

    // Command: CLEAR
    if (/^(clear|clear input|delete|മായ്ക്കുക)$/.test(currentSegment)) {
      setInput('');
      sessionPrefixRef.current = '';
      startListening(); // reset mic buffer
      return;
    }

    // Command: STOP
    if (/(stop|quiet|shut up|silence|abort|halt|നിർത്തുക)/.test(currentSegment)) {
      onSendMessage("stop"); // App.jsx intercepts this and halts audio
      setInput('');
      sessionPrefixRef.current = '';
      startListening(); // reset mic buffer
      return;
    }

    // Prevent echoing her own voice
    if (isSpeaking) {
      return; 
    }

    // Normal Transcript Building
    const prefix = sessionPrefixRef.current ? sessionPrefixRef.current : '';
    const newText = prefix + finalTranscript + interimTranscript;
    setInput(newText);

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    // Auto-submit logic
    if (newText.trim() && !interimTranscript && !isProcessing) {
      submitTimeoutRef.current = setTimeout(() => {
        onSendMessage(newText.trim());
        setInput('');
        sessionPrefixRef.current = '';
        startListening(); // Restart mic session to clear the `event.results` buffer
      }, 1500); // Reduced delay to 1.5s for faster response
    }
  };

  const { isListening, startListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript, language);

  // Prevent text from disappearing when the browser's mic naturally pauses and restarts
  useEffect(() => {
    if (!isListening && input) {
      sessionPrefixRef.current = input.trim() + ' ';
    }
  }, [isListening, input]);

  // Auto-start hands-free listening on mount
  useEffect(() => {
    if (isSupported) {
      startListening();
    }
  }, [isSupported, startListening]);

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

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en-US' ? 'ml-IN' : 'en-US');
  };

  return (
    <div className="input-wrapper hud-panel">
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>

      <div className="input-header text-mono">
        <span className="text-blue">SYS.COM // DIRECTIVE_INPUT // LANG: {language === 'en-US' ? 'ENG' : 'MAL'}</span>
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
          title="Toggle Microphone"
        >
          <div className="mic-core"></div>
        </button>

        <button 
          type="button" 
          onClick={toggleLanguage}
          className="lang-btn text-mono"
          title="Toggle Language (EN/ML)"
        >
          {language === 'en-US' ? 'EN' : 'ML'}
        </button>
        
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isListening ? (language === 'en-US' ? "TRANSMITTING AUDIO SIGNAL..." : "ശബ്ദ സിഗ്നൽ നൽകുക...") : "ENTER COMMAND DIRECTIVE..."}
          className="command-input text-mono text-cyan"
          disabled={isProcessing || isListening}
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

        .lang-btn {
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid var(--hud-cyan);
          color: var(--hud-cyan);
          font-size: 0.8rem;
          font-weight: bold;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lang-btn:hover {
          background: rgba(0, 240, 255, 0.3);
          color: #fff;
          box-shadow: 0 0 10px var(--hud-cyan-glow);
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
        .command-input:disabled {
          opacity: 1;
          color: var(--hud-cyan);
          background: rgba(0, 15, 30, 0.8);
          border-color: rgba(0, 240, 255, 0.4);
          cursor: not-allowed;
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
          .mic-btn, .lang-btn {
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
