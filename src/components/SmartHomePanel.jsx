import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiPower, FiActivity, FiAlertTriangle, FiMoon, FiAperture, FiWifiOff, FiMic } from 'react-icons/fi';

const API_BASE = 'http://localhost:5000/api/bulb';

export function SmartHomePanel() {
  const [isOn, setIsOn] = useState(false);
  const [colorHex, setColorHex] = useState('#ffffff');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spotifyAuth, setSpotifyAuth] = useState(false);
  
  const debounceTimeout = useRef(null);

  // Helper: Hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const [brightness, setBrightness] = useState(100);

  const forceToggle = useCallback(async (newState) => {
    try {
      setIsOn(newState);
      setError(null);
      
      const res = await fetch(`${API_BASE}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      if (!res.ok) throw new Error('Failed to toggle');
    } catch (err) {
      console.error(err);
      setIsOn(!newState); // Revert on failure
      setError('COMM_ERROR');
    }
  }, []);

  const forceColorChange = useCallback(async (newColorHex, turnOnIfOff = true) => {
    setColorHex(newColorHex);
    const rgb = hexToRgb(newColorHex);
    if (!rgb) return;
    
    try {
      if (turnOnIfOff && !isOn) await forceToggle(true);
      
      await fetch(`${API_BASE}/color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r: rgb.r, g: rgb.g, b: rgb.b, hex: newColorHex })
      });
    } catch (err) {
      console.error(err);
      setError('COLOR_SYNC_ERROR');
    }
  }, [isOn, forceToggle]);

  const forceBrightnessChange = useCallback(async (newLevel) => {
    setBrightness(newLevel);
    try {
      await fetch(`${API_BASE}/brightness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: newLevel })
      });
    } catch (err) {
      console.error(err);
      setError('BRIGHTNESS_SYNC_ERROR');
    }
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/status`);
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        if (data.success) {
          setIsOn(data.power);
          if (data.color_hex) {
            setColorHex(data.color_hex);
          }
        }
      } catch (err) {
        setError('SYS_OFFLINE');
      } finally {
        setLoading(false);
      }
      
      try {
        const spotRes = await fetch('http://localhost:5000/api/spotify/status');
        if (spotRes.ok) {
          const spotData = await spotRes.json();
          setSpotifyAuth(spotData.authenticated);
        }
      } catch (err) {
        // Ignore spotify status fetch errors
      }
    };

    fetchStatus();
    
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColorHex(newColor);
    
    if (!isOn) return;
    
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      forceColorChange(newColor, false);
    }, 250); 
  };

  const handleBrightnessChange = (e) => {
    const level = parseInt(e.target.value, 10);
    setBrightness(level);

    if (!isOn) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      forceBrightnessChange(level);
    }, 250);
  };

  const handleSpotifyLogin = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/spotify/login');
      const data = await res.json();
      if (data.auth_url) {
        window.open(data.auth_url, '_blank', 'width=500,height=700');
      }
    } catch (err) {
      console.error("Failed to fetch Spotify login URL", err);
    }
  };

  return (
    <div className="hud-panel data-box" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>
      <h3>SMART_HOME_LINK</h3>
      
      <div className="data-row text-mono" style={{ marginBottom: '15px' }}>
        <span>STATUS</span> 
        {loading ? (
          <span className="text-warning" style={{animation: 'flicker 1s infinite'}}>SCANNING...</span>
        ) : error ? (
          <span className="text-alert">{error}</span>
        ) : (
          <span className="text-blue">SECURE</span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Power Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-mono" style={{ fontSize: '0.8rem' }}>MASTER_PWR</span>
          <button 
            onClick={() => forceToggle(!isOn)}
            style={{
              background: isOn ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              border: `1px solid ${isOn ? 'var(--hud-cyan)' : 'var(--hud-cyan-dim)'}`,
              color: isOn ? 'var(--hud-cyan)' : 'var(--hud-cyan-dim)',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
          >
            <FiPower size={14} />
            <span className="text-mono">{isOn ? 'ONLINE' : 'STANDBY'}</span>
          </button>
        </div>

        {/* Color Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-mono" style={{ fontSize: '0.8rem' }}>HUE_SYNC</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--hud-cyan-dim)' }}>
              {colorHex.toUpperCase()}
            </span>
            <input 
              type="color" 
              value={colorHex} 
              onChange={handleColorChange}
              style={{
                width: '30px',
                height: '30px',
                border: '1px solid var(--hud-cyan)',
                background: 'transparent',
                cursor: 'crosshair',
                padding: '2px'
              }}
            />
          </div>
        </div>

        {/* Brightness Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-mono" style={{ fontSize: '0.8rem' }}>INTENSITY</span>
            <span className="text-mono text-cyan" style={{ fontSize: '0.7rem' }}>{brightness}%</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="100" 
            value={brightness} 
            onChange={handleBrightnessChange}
            style={{
              width: '100%',
              accentColor: 'var(--hud-cyan)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Spotify Integration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', paddingTop: '10px', borderTop: '1px solid rgba(0, 240, 255, 0.2)' }}>
          <span className="text-mono" style={{ fontSize: '0.8rem' }}>SPOTIFY_LINK</span>
          {spotifyAuth ? (
             <span className="text-mono text-blue" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>[ AUTHENTICATED ]</span>
          ) : (
            <button 
              onClick={handleSpotifyLogin}
              className="text-mono"
              style={{
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid var(--hud-cyan)',
                color: 'var(--hud-cyan)',
                padding: '4px 8px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              AUTHORIZE
            </button>
          )}
        </div>

        {/* Status indicator bar */}
        <div style={{ marginTop: 'auto' }}>
          <div className="data-row text-mono" style={{ fontSize: '0.7rem' }}>
            <span>SIGNAL_STR</span> 
            <span className="text-cyan">{error ? '0%' : '98%'}</span>
          </div>
          <div className="bar-container">
            <div className="bar-fill" style={{width: error ? '0%' : '98%', background: error ? 'var(--hud-alert)' : 'var(--hud-cyan)'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
