'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';

interface Props {
  text: string;
}

const DG_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';

export default function SpeakButton({ text }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const performTTS = async () => {
    if (!DG_API_KEY) {
      console.warn('Deepgram API key not configured for TTS');
      return;
    }
    
    // Stop if currently playing
    if (status === 'playing' || status === 'loading') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setStatus('idle');
      return;
    }

    try {
      setStatus('loading');
      
      // Clean up markdown/sources from text to improve speech
      let cleanText = text
        .replace(/\[Source: [^\]]+\]/g, '')
        .replace(/\(Source \d+(, Source \d+)*\)/g, '')
        .replace(/\*\*|`|#/g, '')
        .trim();
        
      if (!cleanText) {
        setStatus('idle');
        return;
      }
      
      // Deepgram max length is 2000
      if (cleanText.length > 1999) {
        cleanText = cleanText.substring(0, 1996) + '...';
      }
      
      const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DG_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        let errMessage = 'TTS Failed';
        try {
          const errData = await response.json();
          errMessage = `TTS Failed: ${JSON.stringify(errData)}`;
        } catch {
          errMessage = `TTS Failed with status: ${response.status}`;
        }
        throw new Error(errMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setStatus('idle');
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setStatus('error');
        URL.revokeObjectURL(url);
      };

      await audio.play();
      setStatus('playing');
      
    } catch (err) {
      console.error('Deepgram TTS Error:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <button
      onClick={performTTS}
      disabled={status === 'loading'}
      title="Speak response"
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors border shadow-sm ${
        status === 'playing'
          ? 'bg-blue-100 text-blue-600 border-blue-200'
          : status === 'error'
            ? 'bg-red-50 text-red-500 border-red-200'
            : 'bg-white text-slate-400 hover:text-blue-500 hover:bg-slate-50 border-slate-200'
      }`}
    >
      {status === 'loading' ? (
        <Loader2 size={12} className="animate-spin" />
      ) : status === 'playing' ? (
        <Square size={12} className="fill-current" />
      ) : (
        <Volume2 size={12} />
      )}
    </button>
  );
}
