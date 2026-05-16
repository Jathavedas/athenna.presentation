import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { generateAthenaResponse } from './lib/gemini';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { Background3D } from './components/Background3D';

function App() {
  const [messages, setMessages] = useState([
    { role: 'model', content: "SYSTEM INITIALIZED. CORE ARCHITECTURE ONLINE.\n\nI AM ATHENA. HOW MAY I ASSIST YOU IN UNDERSTANDING THIS PROJECT?" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { speak, isSpeaking } = useSpeechSynthesis();

  // Simulated telemetry data
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(324);
  const [netIn, setNetIn] = useState(45);
  const [netOut, setNetOut] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 30) + 5);
      setMem(Math.floor(Math.random() * 200) + 300);
      setNetIn(Math.floor(Math.random() * 100));
      setNetOut(Math.floor(Math.random() * 50));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (content) => {
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const history = messages.filter(m => m.role !== 'system'); 
    const responseText = await generateAthenaResponse(history, content);

    const aiMsg = { role: 'model', content: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setIsProcessing(false);

    speak(responseText);
  };

  return (
    <>
      <div className="global-scanline"></div>
      
      <Background3D />

      <div className="master-container">
        {/* LEFT TELEMETRY PANEL */}
        <aside className="side-panel">
          <div className="hud-panel data-box">
            <div className="corner-tr"></div>
            <div className="corner-bl"></div>
            <h3>SYS_DIAGNOSTICS</h3>
            <div className="data-row text-mono"><span>CPU_LOAD</span> <span className="text-cyan">{cpu}%</span></div>
            <div className="bar-container"><div className="bar-fill" style={{width: `${cpu}%`}}></div></div>
            
            <div className="data-row text-mono"><span>MEM_USAGE</span> <span className="text-cyan">{mem}MB</span></div>
            <div className="bar-container"><div className="bar-fill" style={{width: `${(mem/1024)*100}%`}}></div></div>
          </div>
          
          <div className="hud-panel data-box" style={{ flex: 1 }}>
            <div className="corner-tr"></div>
            <div className="corner-bl"></div>
            <h3>NETWORK_UPLINK</h3>
            <div className="data-row text-mono"><span>STATUS</span> <span className="text-blue">SECURE</span></div>
            <div className="data-row text-mono"><span>LATENCY</span> <span className="text-cyan">14ms</span></div>
            <br/>
            <div className="data-row text-mono"><span>PACKETS_IN</span> <span className="text-cyan">{netIn} kb/s</span></div>
            <div className="data-row text-mono"><span>PACKETS_OUT</span> <span className="text-cyan">{netOut} kb/s</span></div>
          </div>
        </aside>

        {/* CENTER CHAT INTERFACE */}
        <main className="center-panel">
          <header className="app-header hud-panel">
            <div className="corner-tr"></div>
            <div className="corner-bl"></div>
            <div className="header-title flex-center text-mono text-cyan">
              <div className="sys-status">
                [ <span className={isProcessing ? 'text-warning' : isSpeaking ? 'text-blue' : 'text-cyan'} style={{animation: 'flicker 2s infinite'}}>
                  {isProcessing ? 'COMPUTING_RESPONSE' : isSpeaking ? 'AUDIO_TRANSMISSION' : 'ONLINE_AWAITING'}
                </span> ]
              </div>
              <span className="system-name" style={{fontSize: '1.5rem', textShadow: '0 0 15px var(--hud-cyan-glow)'}}>A.T.H.E.N.A.</span>
              <span className="version text-blue">V_1.0.0</span>
            </div>
          </header>

          <div className="chat-container">
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              {isProcessing && (
                <div className="processing-indicator text-mono text-warning">
                  <span style={{animation: 'flicker 0.5s infinite'}}>&gt; PROCESSING ALGORITHMS...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="app-footer">
            <InputArea onSendMessage={handleSendMessage} isProcessing={isProcessing} />
          </footer>
        </main>

        {/* RIGHT TELEMETRY PANEL */}
        <aside className="side-panel">
          <div className="hud-panel data-box" style={{ flex: 1 }}>
            <div className="corner-tr"></div>
            <div className="corner-bl"></div>
            <h3>ACTIVE_DIRECTIVES</h3>
            <div className="text-mono" style={{ fontSize: '0.75rem', lineHeight: '1.8', color: 'var(--hud-cyan-dim)'}}>
              &gt; INIT_CORE_PROTOCOLS<br/>
              <span className="text-blue">[OK] MEMORY_ALLOCATED</span><br/>
              &gt; ESTABLISH_E-COMMERCE_LINK<br/>
              <span className="text-blue">[OK] API_GATEWAY_SECURED</span><br/>
              &gt; CALIBRATE_HARDWARE_PREPRESS<br/>
              <span className="text-blue">[OK] SKYCUT_SYNCED</span><br/>
              &gt; AWAIT_USER_VOICE_INPUT<br/>
              <span className="text-warning">[PENDING]</span>
            </div>
          </div>
        </aside>

        <style>{`
          .app-header {
            padding: 20px 30px;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          .header-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            letter-spacing: 4px;
          }
          .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 0 20px;
            scroll-behavior: smooth;
            position: relative;
            margin-bottom: 20px;
          }
          .chat-container::before {
            content: 'TERMINAL OUTPUT STREAM';
            position: fixed;
            top: 110px; right: 350px;
            font-size: 0.7rem;
            color: var(--hud-cyan-dim);
            letter-spacing: 3px;
            pointer-events: none;
          }
          .messages-list {
            display: flex;
            flex-direction: column;
          }
          .app-footer {
            flex-shrink: 0;
          }
          .processing-indicator {
            font-size: 1rem;
            margin-left: 20px;
            margin-bottom: 24px;
            letter-spacing: 2px;
          }

          /* --- RESPONSIVE PROTOCOLS --- */
          @media (max-width: 1200px) {
            .chat-container::before {
              display: none;
            }
          }

          @media (max-width: 768px) {
            .header-title {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
              font-size: 0.9rem;
            }
            .app-header {
              padding: 15px;
            }
            .chat-container {
              padding: 0 10px;
            }
            .processing-indicator {
              margin-left: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default App;
