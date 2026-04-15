// -- Subjects API client ---------------------------------------------------

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('teachai-token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
}

export interface Subject {
  id: string;
  name: string;
  classCode?: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    enrollments: number;
  };
}

export const subjectsApi = {
  list: async (): Promise<Subject[]> => {
    const res = await fetch(`${API}/subjects`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
  },

  get: async (id: string): Promise<Subject> => {
    const res = await fetch(`${API}/subjects/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subject');
    return res.json();
  },

  create: async (name: string): Promise<Subject> => {
    const res = await fetch(`${API}/subjects`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create subject');
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API}/subjects/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete subject');
  },

  update: async (id: string, name: string): Promise<Subject> => {
    const res = await fetch(`${API}/subjects/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update subject');
    return data;
  },
};
