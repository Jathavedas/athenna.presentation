import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeechRecognition(onTranscript, language = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const languageRef = useRef(language);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
      }
    }
  }, []);

  const shouldListenRef = useRef(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    shouldListenRef.current = true;

    if (recognitionRef.current) {
      try {
        const oldRec = recognitionRef.current;
        recognitionRef.current = null; // Unlink so onend doesn't restart it
        oldRec.onresult = null;
        oldRec.onerror = null;
        oldRec.onend = null;
        oldRec.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = languageRef.current;

    rec.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (onTranscriptRef.current) {
        onTranscriptRef.current({ finalTranscript, interimTranscript });
      }
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        setIsListening(false);
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current) {
              startListening();
            }
          }, 1000);
        }
      }
    };

    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (languageRef.current !== language) {
      languageRef.current = language;
      if (isListening) {
        startListening(); // Restart with new language
      }
    }
  }, [language, isListening, startListening]);

  return {
    isListening,
    startListening,
    toggleListening,
    isSupported
  };
}
