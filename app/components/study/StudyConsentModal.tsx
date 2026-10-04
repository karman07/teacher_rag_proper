'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface Props {
  text: string;
  onAnswer: (agreed: boolean) => Promise<void>;
}

/** Blocking consent dialog. Nothing about the student is rated or exported unless they press "I agree". */
export default function StudyConsentModal({ text, onAnswer }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const answer = async (agreed: boolean) => {
    setBusy(true);
    setError('');
    try {
      await onAnswer(agreed);
    } catch {
      setError('Could not save your choice. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="study-consent-title">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><FlaskConical size={20} /></div>
          <div>
            <h2 id="study-consent-title" className="text-lg font-black text-slate-900 leading-tight">Research study consent</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Voluntary · does not affect your grades</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{text}</p>
        {error && <p className="mt-3 text-xs font-bold text-red-600">{error}</p>}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button disabled={busy} onClick={() => answer(false)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            No thanks
          </button>
          <button disabled={busy} onClick={() => answer(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
            I agree
          </button>
        </div>
      </div>
    </div>
  );
}
