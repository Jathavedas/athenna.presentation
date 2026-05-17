import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceQueue = useRef([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    updateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;

    // Stop current speech and clear queue
    window.speechSynthesis.cancel();
    utteranceQueue.current = [];
    setIsSpeaking(true);

    // Clean markdown before speaking
    const cleanText = text.replace(/[*_#`]/g, '');

    // Split text into chunks (sentences) to prevent browser TTS glitching/cutting off
    // Matches sentences ending in . ! ? or newlines
    const chunks = cleanText.match(/[^.!?\n]+[.!?\n]+/g) || [cleanText];
    
    const isMalayalam = /[\u0D00-\u0D7F]/.test(cleanText);

    let preferredVoice;
    if (isMalayalam) {
      preferredVoice = voices.find(v => v.lang === 'ml-IN') || voices.find(v => v.lang.startsWith('ml'));
    } else {
      preferredVoice = voices.find(v => 
        v.name.includes('Google UK English Female') || 
        v.name.includes('Microsoft Hazel') ||
        (v.lang === 'en-GB' && v.name.includes('Female'))
      ) || voices.find(v => v.lang === 'en-US');
    }

    if (!preferredVoice) preferredVoice = voices[0];

    const playNext = () => {
      if (utteranceQueue.current.length === 0) {
        setIsSpeaking(false);
        return;
      }

      const nextChunk = utteranceQueue.current.shift();
      const utterance = new SpeechSynthesisUtterance(nextChunk);
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else if (isMalayalam) {
        utterance.lang = 'ml-IN';
      }

      utterance.rate = isMalayalam ? 0.9 : 1.05; // Malayalam often sounds better slightly slower
      utterance.pitch = 0.9;

      utterance.onend = playNext;
      utterance.onerror = (e) => {
        console.error("Speech synthesis error on chunk", e);
        playNext(); // Continue to next chunk even if one fails
      };

      window.speechSynthesis.speak(utterance);
    };

    // Populate queue and start
    utteranceQueue.current = chunks.map(c => c.trim()).filter(c => c.length > 0);
    playNext();

  }, [voices]);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    utteranceQueue.current = [];
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
