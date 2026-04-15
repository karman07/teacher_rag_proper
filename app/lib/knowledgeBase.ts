// -- Knowledge Base API client ----------------------------------------------

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

export interface KnowledgeFile {
  id: string;
  name: string;
  originalName: string;
  displayName: string | null;   // Teacher-editable alias
  tags: string[];               // Teacher-applied tags
  mimeType: string;
  sizeBytes: number;
  source: 'upload' | 'google_drive' | 'dropbox' | 'notion' | 'onedrive' | 's3';
  status: 'uploading' | 'processing' | 'ready' | 'error';
  chunkCount: number;
  cloudFileId?: string;
  createdAt: string;
}

export interface KnowledgeBaseStats {
  totalFiles: number;
  totalSizeBytes: number;
  totalChunks: number;
  readyFiles: number;
  processingFiles: number;
  errorFiles: number;
  collectionName: string;
}

export const knowledgeBaseApi = {
  getStats: async (): Promise<KnowledgeBaseStats> => {
    const res = await fetch(`${API}/knowledge-base/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  listFiles: async (source?: string, subjectId?: string): Promise<KnowledgeFile[]> => {
    const url = new URL(`${API}/knowledge-base/files`);
    if (source) url.searchParams.set('source', source);
    if (subjectId) url.searchParams.set('subjectId', subjectId);
    
    const headers = authHeaders();
    console.log(`[listFiles] Fetching from: ${url.toString()}`);
    
    const res = await fetch(url.toString(), { headers });
    
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error('[listFiles] Error response:', res.status, errorBody);
      throw new Error(errorBody.message || 'Failed to list files');
    }
    
    return res.json();
  },

  uploadFile: async (file: File, onProgress?: (pct: number) => void, subjectId?: string): Promise<KnowledgeFile> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (subjectId) formData.append('subjectId', subjectId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}/knowledge-base/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const body = JSON.parse(xhr.responseText || '{}');
          reject(new Error(body.message || 'Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  },

  importFromGoogleDrive: async (payload: {
    accessToken: string;
    fileId: string;
    fileName: string;
    mimeType?: string;
    subjectId?: string;
  }): Promise<KnowledgeFile> => {
    const res = await fetch(`${API}/knowledge-base/google-drive`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google Drive import failed');
    return data;
  },

  importFromDropbox: async (payload: {
    link: string;
    name: string;
    sizeBytes?: number;
    subjectId?: string;
  }): Promise<KnowledgeFile> => {
    const res = await fetch(`${API}/knowledge-base/dropbox`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Dropbox import failed');
    return data;
  },

  importFromS3: async (payload: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    key: string;
    subjectId?: string;
  }): Promise<KnowledgeFile> => {
    const res = await fetch(`${API}/knowledge-base/s3`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'S3 import failed');
    return data;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    const res = await fetch(`${API}/knowledge-base/files/${fileId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  batchDelete: async (ids: string[]): Promise<void> => {
    const res = await fetch(`${API}/knowledge-base/files/batch-delete`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Batch delete failed');
  },

  updateFileMeta: async (
    fileId: string,
    data: { displayName?: string; tags?: string[]; subjectId?: string | null },
  ): Promise<KnowledgeFile> => {
    const res = await fetch(`${API}/knowledge-base/files/${fileId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? 'Failed to update file');
    return json;
  },
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📊';
  if (mimeType.includes('spreadsheet') || mimeType.includes('xlsx')) return '📈';
  if (mimeType.includes('text')) return '📃';
  return '📁';
}
