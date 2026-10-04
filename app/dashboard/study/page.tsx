'use client';

import { useEffect, useState, useCallback } from 'react';
import { FlaskConical, Download, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { subjectsApi, Subject } from '../../lib/subjects';
import {
  studyApi, StudyConfig, StudySummary, ReviewItem, ReviewQueue, RubricDimension,
} from '../../lib/studyApi';

type Tab = 'setup' | 'review' | 'results';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';
const label = 'text-[10px] font-black uppercase tracking-widest text-slate-500';

function Banner({ kind, children }: { kind: 'error' | 'ok'; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl px-4 py-2.5 text-xs font-bold ${kind === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      {children}
    </div>
  );
}

/* ─────────────────────────────  Setup  ───────────────────────────── */
function SetupTab({ subject }: { subject: Subject }) {
  const [config, setConfig] = useState<StudyConfig | null>(null);
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await studyApi.getConfig(subject.id);
      setConfig(c);
      setText(c.consentText);
    } catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); }
  }, [subject.id]);
  useEffect(() => { setConfig(null); setMsg(null); load(); }, [load]);

  const run = async (fn: () => Promise<StudyConfig>, ok: string) => {
    setBusy(true); setMsg(null);
    try { const c = await fn(); setConfig(c); setText(c.consentText); setMsg({ kind: 'ok', text: ok }); }
    catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); }
    finally { setBusy(false); }
  };

  if (!config) return <div className={card}><p className="text-sm text-slate-500">{msg?.text ?? 'Loading…'}</p></div>;

  return (
    <div className="space-y-6">
      {msg && <Banner kind={msg.kind}>{msg.text}</Banner>}

      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Study mode for “{subject.name}”</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              When enabled, students see a consent dialog. Only students who agree are asked to rate answers and complete the surveys,
              and only their data can be reviewed or exported. Declining changes nothing about how the assistant works for them.
            </p>
          </div>
          <button disabled={busy} onClick={() => run(() => studyApi.updateConfig(subject.id, { enabled: !config.enabled }), config.enabled ? 'Study mode disabled.' : 'Study mode enabled.')}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 ${config.enabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
            {config.enabled ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </div>

      <div className={card}>
        <p className={label}>Consent text (version {config.consentVersion})</p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={7}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-blue-400" />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5"><ShieldCheck size={14} /> Changing this text starts a new consent version: students are asked again.</p>
          <button disabled={busy || text.trim() === config.consentText.trim()} onClick={() => run(() => studyApi.updateConfig(subject.id, { consentText: text }), 'Consent text saved.')}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
            Save
          </button>
        </div>
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Make sure the study has the approval your institution requires (e.g. an ethics committee) before enabling it with real students.
        </p>
      </div>

      <div className={card}>
        <p className={label}>Expert reviewers</p>
        <p className="mt-1 text-sm text-slate-500">Invite other teachers (by the email of their teacher account) to rate answers with the rubric. Use at least two reviewers if you want to report inter-rater agreement.</p>
        <ul className="mt-4 divide-y divide-slate-100">
          {config.reviewers.length === 0 && <li className="py-2 text-sm text-slate-400">No reviewers yet. You can always review as the subject owner.</li>}
          {config.reviewers.map(r => (
            <li key={r.userId} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{r.name || r.email} <span className="text-slate-400">· {r.email}</span></span>
              <button disabled={busy} onClick={() => run(() => studyApi.removeReviewer(subject.id, r.userId), 'Reviewer removed.')} aria-label={`Remove ${r.email}`}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
        <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (email.trim()) run(() => studyApi.addReviewer(subject.id, email.trim()), 'Reviewer added.').then(() => setEmail('')); }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="reviewer@university.edu"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
          <button disabled={busy || !email.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40">
            <Plus size={14} /> Add
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────  Review  ───────────────────────────── */
function Scale({ value, onChange, name }: { value: number | null; onChange: (v: number) => void; name: string }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={name}>
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`w-9 h-9 rounded-xl text-xs font-black border transition-colors ${value === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
          {v}
        </button>
      ))}
    </div>
  );
}

function ReviewTab() {
  const [subjects, setSubjects] = useState<{ id: string; name: string; isOwner: boolean }[] | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [rubric, setRubric] = useState<RubricDimension[]>([]);
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [revealed, setRevealed] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    studyApi.reviewSubjects().then(s => { setSubjects(s); if (s[0]) setSubjectId(s[0].id); }).catch(e => setError(errMsg(e)));
    studyApi.instruments().then(i => setRubric(i.rubric)).catch(() => {});
  }, []);

  const loadQueue = useCallback(async () => {
    if (!subjectId) return;
    setError('');
    try { setQueue(await studyApi.queue(subjectId, 5)); } catch (e) { setError(errMsg(e)); }
    setScores({}); setRevealed(null); setNotes('');
  }, [subjectId]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const item: ReviewItem | undefined = queue?.items[0];
  const required = rubric.filter(d => d.key !== 'citationQuality');
  const complete = !!item && required.every(d => scores[d.key]) && (!item.hasCitations || !!scores.citationQuality);

  const submit = async () => {
    if (!item || !complete) return;
    setSaving(true); setError('');
    try {
      await studyApi.submitReview({
        messageId: item.messageId,
        relevance: scores.relevance!, factualAccuracy: scores.factualAccuracy!,
        groundingQuality: scores.groundingQuality!, educationalValue: scores.educationalValue!,
        citationQuality: item.hasCitations ? scores.citationQuality! : null,
        revealedSolution: revealed, notes: notes.trim() || undefined,
      });
      await loadQueue();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  };

  if (subjects && subjects.length === 0) {
    return <div className={card}><p className="text-sm text-slate-500">No subject has study mode enabled for you yet. Enable it under “Setup” (or ask a subject owner to add you as a reviewer).</p></div>;
  }

  return (
    <div className="space-y-5">
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex flex-wrap items-center gap-4">
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
          {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {queue && <span className="text-xs font-bold text-slate-500">You have rated {queue.progress.reviewedByMe} · {queue.progress.eligible} answers from consenting students are eligible</span>}
      </div>

      {queue && !item && (
        <div className={`${card} flex items-center gap-3`}><CheckCircle2 className="text-emerald-600" size={20} />
          <p className="text-sm text-slate-600">Nothing left to review right now. New answers appear as consenting students use the assistant.</p></div>
      )}

      {item && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className={card}>
              <p className={label}>Student question</p>
              <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{item.question}</p>
            </div>
            <div className={card}>
              <p className={label}>Assistant answer</p>
              <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{item.answer}</p>
            </div>
            <div className={card}>
              <p className={label}>Retrieved sources ({item.sources.length})</p>
              {item.sources.length === 0 && <p className="mt-2 text-sm text-slate-400">The answer shows no sources.</p>}
              <ol className="mt-2 space-y-2">
                {item.sources.map((s, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-xs font-black text-slate-600">{i + 1}. {s.fileName ?? 'Unknown file'}{s.page ? ` · page ${s.page}` : ''}{s.timestamp ? ` · ${s.timestamp}` : ''}</p>
                    {s.snippet && <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">{s.snippet}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className={`${card} space-y-5 h-fit lg:sticky lg:top-4`}>
            <p className={label}>Rubric (1 = poor, 5 = excellent)</p>
            {rubric.map(d => {
              const na = d.key === 'citationQuality' && !item.hasCitations;
              return (
                <div key={d.key} className={na ? 'opacity-40' : ''}>
                  <p className="text-sm font-black text-slate-800">{d.label}</p>
                  <p className="text-xs text-slate-500 mb-2">{na ? 'Not applicable: the answer has no citations.' : d.description}</p>
                  {!na && <Scale name={d.label} value={scores[d.key] ?? null} onChange={v => setScores(s => ({ ...s, [d.key]: v }))} />}
                </div>
              );
            })}
            <div>
              <p className="text-sm font-black text-slate-800">Does the answer give a complete solution to graded work?</p>
              <p className="text-xs text-slate-500 mb-2">Only if the question concerns an assignment. Leave unset otherwise.</p>
              <div className="flex gap-2">
                {([['Yes', true], ['No', false], ['N/A', null]] as const).map(([lbl, val]) => (
                  <button key={lbl} type="button" onClick={() => setRevealed(val)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${revealed === val ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{lbl}</button>
                ))}
              </div>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="Optional notes"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" />
            <button onClick={submit} disabled={!complete || saving}
              className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
              {saving ? 'Saving…' : 'Submit and next'}
            </button>
            <p className="text-[11px] text-slate-400">Reviews are blind: you cannot see who asked the question, the student’s own rating, or other reviewers’ scores.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────  Results  ───────────────────────────── */
function ResultsTab({ subject }: { subject: Subject }) {
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSummary(null); setError(''); studyApi.summary(subject.id).then(setSummary).catch(e => setError(errMsg(e))); }, [subject.id]);

  const dl = async (withText: boolean) => {
    setBusy(true);
    try { await studyApi.downloadExport(subject.id, withText); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const f = (x: number | null | undefined, d = 2) => (x == null ? '—' : x.toFixed(d));

  return (
    <div className="space-y-5">
      {error && <Banner kind="error">{error}</Banner>}
      {summary && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Participants (agreed / declined)', `${summary.participants.agreed} / ${summary.participants.declined}`],
              ['Answer ratings · mean helpfulness', `${summary.studentRatings.n} · ${f(summary.studentRatings.meanHelpful)}`],
              ['SUS responses · mean score', `${summary.surveys.sus.n} · ${f(summary.surveys.sus.mean, 1)}`],
              ['Usefulness responses · mean (1–5)', `${summary.surveys.usefulness.n} · ${f(summary.surveys.usefulness.mean)}`],
              ['Expert reviews · reviewers', `${summary.expertReviews.n} · ${summary.expertReviews.reviewers}`],
              ['Items rated by 2+ reviewers', String(summary.expertReviews.itemsWithTwoOrMoreReviewers)],
              ['Relevance · accuracy (mean)', `${f(summary.expertReviews.means.relevance)} · ${f(summary.expertReviews.means.factualAccuracy)}`],
              ['Grounding · educational value (mean)', `${f(summary.expertReviews.means.groundingQuality)} · ${f(summary.expertReviews.means.educationalValue)}`],
            ].map(([k, v]) => (
              <div key={k} className={card}><p className={label}>{k}</p><p className="mt-2 text-2xl font-black text-slate-900">{v}</p></div>
            ))}
          </div>
          <div className={card}>
            <p className={label}>Export for the paper</p>
            <p className="mt-1 text-sm text-slate-500">Anonymised data of consenting participants only (no names or emails). Run <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">python -m eval.analyze_human export.json</code> in the AI-service repository to compute SUS, Likert statistics and inter-rater agreement.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => dl(false)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50"><Download size={14} /> Ratings only</button>
              <button disabled={busy} onClick={() => dl(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download size={14} /> Include question and answer text</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────  Page  ───────────────────────────── */
export default function StudyPage() {
  const [tab, setTab] = useState<Tab>('setup');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    subjectsApi.list().then(s => { setSubjects(s); if (s[0]) setSubjectId(s[0].id); }).catch(e => setError(errMsg(e)));
  }, []);
  const subject = subjects.find(s => s.id === subjectId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none flex items-center gap-3"><FlaskConical size={28} className="text-blue-600" /> Research Study</h1>
            <p className="text-sm font-bold mt-3 text-slate-500 uppercase tracking-widest">Human evaluation: consent · student ratings · expert review</p>
          </div>
          {tab !== 'review' && (
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          {([['setup', 'Setup'], ['review', 'Review answers'], ['results', 'Results & export']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors ${tab === k ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>

        {error && <Banner kind="error">{error}</Banner>}
        {tab === 'review' ? <ReviewTab /> : subject ? (tab === 'setup' ? <SetupTab subject={subject} /> : <ResultsTab subject={subject} />)
          : <div className={card}><p className="text-sm text-slate-500">Create a subject first to set up a study.</p></div>}
      </div>
    </DashboardLayout>
  );
}
