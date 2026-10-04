'use client';

import { useEffect, useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { studyApi, StudyInstruments } from '@/app/lib/study';

type Instrument = 'sus' | 'usefulness';

interface Props {
  subjectId: string;
  done: { sus: boolean; usefulness: boolean };
  onClose: () => void;
  onSubmitted: (instrument: Instrument) => void;
}

const TITLES: Record<Instrument, string> = {
  sus: 'System usability (SUS)',
  usefulness: 'Educational usefulness',
};

/** The two questionnaires of the study (item wording is served by the backend, identical to Appendix B of the paper). */
export default function StudySurveyModal({ subjectId, done, onClose, onSubmitted }: Props) {
  const [instruments, setInstruments] = useState<StudyInstruments | null>(null);
  const first: Instrument = !done.sus ? 'sus' : 'usefulness';
  const [tab, setTab] = useState<Instrument>(first);
  const [answers, setAnswers] = useState<Record<Instrument, (number | null)[]>>({ sus: Array(10).fill(null), usefulness: Array(8).fill(null) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<Record<Instrument, boolean>>({ sus: done.sus, usefulness: done.usefulness });

  useEffect(() => { studyApi.instruments().then(setInstruments).catch(() => setError('Could not load the questionnaire.')); }, []);

  const items = instruments?.[tab].items ?? [];
  const current = answers[tab];
  const complete = items.length > 0 && current.slice(0, items.length).every(a => a !== null);

  const submit = async () => {
    if (!complete) return;
    setSaving(true);
    setError('');
    try {
      await studyApi.submitSurvey(subjectId, tab, current as number[]);
      setSubmitted(s => ({ ...s, [tab]: true }));
      onSubmitted(tab);
      const other: Instrument = tab === 'sus' ? 'usefulness' : 'sus';
      if (!submitted[other]) setTab(other); else onClose();
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? 'This survey was already submitted.' : 'Could not submit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardList size={20} /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Study feedback</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{instruments?.[tab].scale ?? '1 = Strongly disagree, 5 = Strongly agree'}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="flex gap-2 px-7 pt-4">
          {(['sus', 'usefulness'] as Instrument[]).map(k => (
            <button key={k} onClick={() => setTab(k)} disabled={submitted[k]}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors disabled:opacity-40 ${
                tab === k ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {TITLES[k]}{submitted[k] ? ' ✓' : ''}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-4 space-y-4">
          {submitted[tab] ? (
            <p className="text-sm text-slate-600">You have already submitted this questionnaire. Thank you!</p>
          ) : (
            items.map((text, i) => (
              <fieldset key={`${tab}-${i}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <legend className="sr-only">{`Statement ${i + 1}`}</legend>
                <p className="text-sm text-slate-700 mb-2"><span className="font-black text-slate-400 mr-2">{i + 1}.</span>{text}</p>
                <div className="flex items-center justify-between gap-2" role="radiogroup" aria-label={`Statement ${i + 1}`}>
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-slate-400">Disagree</span>
                  <div className="flex gap-2 mx-auto sm:mx-0">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" role="radio" aria-checked={current[i] === v}
                        onClick={() => setAnswers(a => ({ ...a, [tab]: a[tab].map((x, j) => (j === i ? v : x)) }))}
                        className={`w-9 h-9 rounded-xl text-xs font-black border transition-colors ${
                          current[i] === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-slate-400">Agree</span>
                </div>
              </fieldset>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-slate-100">
          <span className="text-xs font-bold text-red-600">{error}</span>
          <button onClick={submit} disabled={!complete || saving || submitted[tab]}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40">
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
