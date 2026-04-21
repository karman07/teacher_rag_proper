// lib/analytics.ts — Client-side question analytics engine

export interface QuestionRecord {
  id: string;
  question: string;
  subjectId: string;
  subjectName: string;
  timestamp: number;
  topics: string[];
  keywords: string[];
}

export interface TopicInsight {
  topic: string;
  count: number;
  percentage: number;
  questions: string[];
  lastAsked: number;
}

export interface WeakArea {
  topic: string;
  repetitions: number;
  reason: string;
  questions: string[];
}

const ANALYTICS_KEY = 'student-question-analytics';

// ── Topic extraction keywords mapping ─────────────────────────────────────────
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Mathematics': ['equation', 'formula', 'calculate', 'solve', 'algebra', 'calculus', 'derivative', 'integral', 'matrix', 'vector', 'probability', 'statistics', 'theorem', 'proof', 'graph', 'function', 'limit', 'sequence', 'series'],
  'Physics': ['force', 'energy', 'motion', 'velocity', 'acceleration', 'mass', 'gravity', 'wave', 'frequency', 'charge', 'current', 'voltage', 'electric', 'magnetic', 'thermodynamics', 'quantum', 'relativity'],
  'Chemistry': ['atom', 'molecule', 'reaction', 'bond', 'element', 'compound', 'acid', 'base', 'electron', 'proton', 'neutron', 'oxidation', 'reduction', 'catalyst', 'solution', 'concentration'],
  'Biology': ['cell', 'organism', 'evolution', 'genetics', 'dna', 'protein', 'enzyme', 'photosynthesis', 'respiration', 'ecosystem', 'species', 'mutation', 'chromosome', 'membrane'],
  'Computer Science': ['algorithm', 'code', 'function', 'variable', 'loop', 'array', 'database', 'network', 'program', 'software', 'hardware', 'binary', 'data structure', 'recursion', 'complexity'],
  'History': ['war', 'revolution', 'civilization', 'empire', 'century', 'period', 'historical', 'colony', 'independence', 'dynasty', 'culture', 'society'],
  'Economics': ['market', 'supply', 'demand', 'inflation', 'gdp', 'trade', 'capital', 'investment', 'price', 'cost', 'profit', 'economy', 'fiscal', 'monetary'],
  'Concepts & Theory': ['what is', 'define', 'explain', 'concept', 'principle', 'theory', 'law', 'meaning', 'describe', 'overview'],
  'Problem Solving': ['how to', 'solve', 'find', 'calculate', 'determine', 'compute', 'derive', 'prove', 'show that', 'evaluate'],
  'Analysis & Comparison': ['compare', 'difference', 'similar', 'analyze', 'evaluate', 'assess', 'advantages', 'disadvantages', 'pros', 'cons', 'better', 'worse'],
  'Examples & Application': ['example', 'application', 'real world', 'use case', 'demonstrate', 'illustrate', 'practice', 'exercise'],
  'Summary & Review': ['summarize', 'summary', 'key points', 'important', 'main', 'overview', 'review', 'recap'],
};

// ── Extract topics from a question ────────────────────────────────────────────
function extractTopics(question: string): string[] {
  const lower = question.toLowerCase();
  const found: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter(kw => lower.includes(kw));
    if (matches.length > 0) {
      found.push(topic);
    }
  }

  return found.length > 0 ? found : ['General'];
}

// ── Extract keywords from question ────────────────────────────────────────────
function extractKeywords(question: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'it', 'its', 'you', 'your', 'we', 'us', 'our']);
  
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 8);
}

// ── CRUD for question records ─────────────────────────────────────────────────
export function getQuestionRecords(): QuestionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveQuestionRecord(
  question: string,
  subjectId: string,
  subjectName: string
): QuestionRecord {
  const record: QuestionRecord = {
    id: crypto.randomUUID(),
    question,
    subjectId,
    subjectName,
    timestamp: Date.now(),
    topics: extractTopics(question),
    keywords: extractKeywords(question),
  };

  const existing = getQuestionRecords();
  existing.push(record);
  
  // Keep last 200 records
  const trimmed = existing.slice(-200);
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  
  return record;
}

// ── Analytics computations ────────────────────────────────────────────────────
export function getTopicInsights(subjectId?: string): TopicInsight[] {
  const records = getQuestionRecords().filter(r => !subjectId || r.subjectId === subjectId);
  const topicMap: Record<string, { count: number; questions: string[]; lastAsked: number }> = {};

  for (const record of records) {
    for (const topic of record.topics) {
      if (!topicMap[topic]) topicMap[topic] = { count: 0, questions: [], lastAsked: 0 };
      topicMap[topic].count++;
      if (record.question && topicMap[topic].questions.length < 5) {
        topicMap[topic].questions.push(record.question);
      }
      if (record.timestamp > topicMap[topic].lastAsked) {
        topicMap[topic].lastAsked = record.timestamp;
      }
    }
  }

  const total = records.length || 1;
  return Object.entries(topicMap)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      questions: data.questions,
      lastAsked: data.lastAsked,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getWeakAreas(subjectId?: string): WeakArea[] {
  const records = getQuestionRecords().filter(r => !subjectId || r.subjectId === subjectId);
  
  // Topics asked 3+ times are likely weak areas
  const insights = getTopicInsights(subjectId);
  
  return insights
    .filter(i => i.count >= 2)
    .slice(0, 5)
    .map(i => ({
      topic: i.topic,
      repetitions: i.count,
      reason: i.count >= 5 
        ? 'Frequently revisited — may need more focus'
        : i.count >= 3 
          ? 'Asked multiple times — consider reviewing this'
          : 'Recurring questions detected',
      questions: i.questions.slice(0, 3),
    }));
}

export function getActivityByDay(): { day: string; count: number }[] {
  const records = getQuestionRecords();
  const dayMap: Record<string, number> = {};
  
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toLocaleDateString('en-US', { weekday: 'short' });
    dayMap[key] = 0;
  }

  for (const record of records) {
    const date = new Date(record.timestamp);
    const dayDiff = (Date.now() - record.timestamp) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 7) {
      const key = date.toLocaleDateString('en-US', { weekday: 'short' });
      dayMap[key] = (dayMap[key] || 0) + 1;
    }
  }

  return Object.entries(dayMap).map(([day, count]) => ({ day, count }));
}

export function getSubjectBreakdown(): { subject: string; count: number; color: string }[] {
  const records = getQuestionRecords();
  const subjectMap: Record<string, { name: string; count: number }> = {};
  
  for (const record of records) {
    if (!subjectMap[record.subjectId]) {
      subjectMap[record.subjectId] = { name: record.subjectName, count: 0 };
    }
    subjectMap[record.subjectId].count++;
  }

  const colors = ['#2563eb', '#7c3aed', '#0d9488', '#d97706', '#dc2626'];
  return Object.values(subjectMap)
    .sort((a, b) => b.count - a.count)
    .map((s, i) => ({ subject: s.name, count: s.count, color: colors[i % colors.length] }));
}
