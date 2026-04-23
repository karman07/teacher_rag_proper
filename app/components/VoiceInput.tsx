'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'connecting' | 'recording' | 'error';

const DG_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [state, setState] = useState<RecordingState>('idle');
  const [interim, setInterim] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const wsRef       = useRef<WebSocket | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const ctxRef      = useRef<AudioContext | null>(null);

  const stopEverything = useCallback(() => {
    try { processorRef.current?.disconnect(); } catch {}
    try { ctxRef.current?.close(); } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    processorRef.current = null;
    ctxRef.current       = null;
    streamRef.current    = null;
    wsRef.current        = null;
    setInterim('');
  }, []);

  const startRecording = useCallback(async () => {
    if (!DG_API_KEY) {
      setErrMsg('Deepgram key not configured');
      setState('error');
      return;
    }

    setState('connecting');
    setErrMsg('');

    try {
      // 1. Mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // 2. WebSocket to Deepgram
      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=en-US&interim_results=true&smart_format=true`,
        ['token', DG_API_KEY],
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setState('recording');

        // 3. Raw PCM via ScriptProcessor → WebSocket
        const ctx = new AudioContext({ sampleRate: 16000 });
        ctxRef.current = ctx;
        const source    = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const float32 = e.inputBuffer.getChannelData(0);
          // Convert Float32 → Int16
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
          }
          ws.send(int16.buffer);
        };

        source.connect(processor);
        processor.connect(ctx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const transcript = data?.channel?.alternatives?.[0]?.transcript || '';
          const isFinal   = data?.is_final;
          if (transcript) {
            setInterim(transcript);
            if (isFinal && transcript.trim()) {
              onTranscript(transcript.trim());
              setInterim('');
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        setErrMsg('Deepgram connection error');
        setState('error');
        stopEverything();
      };

      ws.onclose = () => {
        if (state === 'recording') setState('idle');
      };

    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError' ? 'Microphone permission denied' : 'Could not start recording';
      setErrMsg(msg);
      setState('error');
      stopEverything();
    }
  }, [onTranscript, stopEverything, state]);

  const stopRecording = useCallback(() => {
    // Send close frame to Deepgram so it flushes final transcript
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
    }
    stopEverything();
    setState('idle');
  }, [stopEverything]);

  // Cleanup on unmount
  useEffect(() => () => { stopEverything(); }, [stopEverything]);

  const isRecording   = state === 'recording';
  const isConnecting  = state === 'connecting';

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isConnecting}
        title={isRecording ? 'Stop recording' : isConnecting ? 'Connecting…' : 'Voice input'}
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
          isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
            : isConnecting
              ? 'bg-slate-200 text-slate-400 cursor-wait'
              : state === 'error'
                ? 'bg-red-50 text-red-400 border border-red-200'
                : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-300'
        }`}
      >
        {isConnecting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
      </button>

      {/* Interim transcript bubble */}
      {interim && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl max-w-xs truncate">
            🎙 {interim}
          </div>
        </div>
      )}

      {/* Error tooltip */}
      {state === 'error' && errMsg && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
          <div className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold whitespace-nowrap shadow-xl">
            {errMsg}
          </div>
        </div>
      )}
    </div>
  );
}
