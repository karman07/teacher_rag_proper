'use client';

import { useState } from 'react';
import { Star, Check } from 'lucide-react';
import { studyApi, CitationSupport } from '@/app/lib/study';

interface Props {
  messageId: string;
  hasCitations: boolean;
  onRated: (messageId: string) => void;
}

const SUPPORT: { value: CitationSupport; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'No' },
];

/** Compact per-answer rating shown under an assistant message for consenting students. */
export default function AnswerRating({ messageId, hasCitations, onRated }: Props) {
  const [helpful, setHelpful] = useState(0);
  const [support, setSupport] = useState<CitationSupport | undefined>();
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const submit = async () => {
    if (!helpful) return;
    setState('saving');
    try {
      await studyApi.rate({
        messageId, helpful,
        citationSupport: hasCitations ? support : 'none',
        comment: comment.trim() || undefined,
      });
      setState('done');
      onRated(messageId);
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
        <Check size={12} /> Thanks for rating
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-2.5" aria-label="Rate this answer">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Was this answer helpful?</span>
        <div className="flex gap-0.5" role="radiogroup" aria-label="Helpfulness from 1 to 5">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" role="radio" aria-checked={helpful === n} aria-label={`${n} of 5`}
              onClick={() => setHelpful(n)} className="p-0.5">
              <Star size={18} className={n <= helpful ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'} />
            </button>
          ))}
        </div>
      </div>

      {helpful > 0 && (
        <>
          {hasCitations && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Did the sources support the answer?</span>
              {SUPPORT.map(o => (
                <button key={o.value} type="button" onClick={() => setSupport(o.value)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                    support === o.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} maxLength={500} placeholder="Optional comment"
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400" />
            <button type="button" onClick={submit} disabled={state === 'saving'}
              className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50">
              {state === 'saving' ? 'Saving…' : 'Submit'}
            </button>
          </div>
          {state === 'error' && <p className="text-[11px] font-bold text-red-600">Could not save your rating. Please try again.</p>}
        </>
      )}
    </div>
  );
}
