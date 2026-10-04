// lib/study.ts — client for the opt-in human-evaluation study mode (consent, answer ratings, surveys).
import axios from 'axios';
import { API_URL, getAuthHeaders } from './api';

export type ConsentState = 'pending' | 'agreed' | 'declined';
export type CitationSupport = 'yes' | 'partly' | 'no' | 'none';

export interface StudyStatus {
  enabled: boolean;
  consentText?: string;
  consentVersion?: number;
  consent?: ConsentState;
  surveysDone?: { sus: boolean; usefulness: boolean };
  answersReceived?: number;
  minAnswersBeforeSurvey?: number;
}

export interface StudyInstruments {
  sus: { items: string[]; scale: string };
  usefulness: { items: string[]; scale: string };
  minAnswersBeforeSurvey: number;
}

export const studyApi = {
  status: async (subjectId: string): Promise<StudyStatus> => {
    const res = await axios.get(`${API_URL}/study/student/status`, { params: { subjectId }, headers: getAuthHeaders() });
    return res.data;
  },
  instruments: async (): Promise<StudyInstruments> => {
    const res = await axios.get(`${API_URL}/study/instruments`, { headers: getAuthHeaders() });
    return res.data;
  },
  consent: async (subjectId: string, agreed: boolean) => {
    const res = await axios.post(`${API_URL}/study/student/consent`, { subjectId, agreed }, { headers: getAuthHeaders() });
    return res.data as { consent: ConsentState };
  },
  rate: async (data: { messageId: string; helpful: number; citationSupport?: CitationSupport; comment?: string }) => {
    const res = await axios.post(`${API_URL}/study/student/ratings`, data, { headers: getAuthHeaders() });
    return res.data;
  },
  myRatings: async (subjectId: string): Promise<string[]> => {
    const res = await axios.get(`${API_URL}/study/student/ratings`, { params: { subjectId }, headers: getAuthHeaders() });
    return res.data;
  },
  submitSurvey: async (subjectId: string, instrument: 'sus' | 'usefulness', answers: number[]) => {
    const res = await axios.post(`${API_URL}/study/student/surveys`, { subjectId, instrument, answers }, { headers: getAuthHeaders() });
    return res.data;
  },
};
