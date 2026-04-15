'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { knowledgeBaseApi, KnowledgeFile } from '../../lib/knowledgeBase';
import { COLORS } from '../../constants/colors';

// --- Brand Icons (Inline SVG, no emoji) -----------------------------------

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 87.3 78" className="w-5 h-5">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);


const NotionIcon = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5">
    <path d="M6 6h88v88H6z" fill="white"/>
    <path d="M18 16h63l-3 5H21v63H15V19z" fill="black"/>
    <path d="M30 26h40v5H30z" fill="black"/>
    <path d="M30 38h35v5H30z" fill="black"/>
    <path d="M30 50h25v5H30z" fill="black"/>
  </svg>
);

const OneDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M10.5 18.5H6a4 4 0 110-8 5.5 5.5 0 0110.65-1.5A3.5 3.5 0 0118 16.5v1H10.5z" fill="#0078D4"/>
    <path d="M14 19.5H20a2.5 2.5 0 000-5 3 3 0 00-5.87-.8A2.5 2.5 0 0014 19.5z" fill="#00B4F0"/>
  </svg>
);

const S3Icon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SOURCES = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Import PDFs, Docs, Slides, and Sheets',
    icon: <GoogleDriveIcon />,
    available: true,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  },
  {
    id: 's3',
    name: 'Amazon S3',
    description: 'Import from AWS S3 Buckets',
    icon: <S3Icon />,
    available: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync pages and databases',
    icon: <NotionIcon />,
    available: false,
    badge: 'Coming Soon',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Import from Microsoft OneDrive',
    icon: <OneDriveIcon />,
    available: false,
    badge: 'Coming Soon',
  },
];

interface Props {
  onImportComplete: (file: KnowledgeFile) => void;
  subjectId?: string;
}

declare global {
  interface Window {
    google?: any;
    gapi?: any;
    Dropbox?: any;
  }
}

export default function SourceConnectors({ onImportComplete, subjectId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const { loginWithGoogle } = useAuth();

  const handleGoogleDrive = async () => {
    setLoading('google_drive');
    try {
      // 1. Get the token from storage
      let accessToken = localStorage.getItem('teachai-google-token');
      
      // 2. If no token (e.g. they use email/pwd), trigger Google login on the fly
      if (!accessToken) {
        console.log('No Google token found, triggering loginWithGoogle...');
        await loginWithGoogle();
        accessToken = localStorage.getItem('teachai-google-token');
        if (!accessToken) throw new Error('Could not obtain Google access token. Please try again.');
      }

      // 3. Load GAPI if needed
      if (!(window as any).gapi) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      // 4. Open the Picker
      (window as any).gapi.load('picker', () => {
        const picker = new (window as any).google.picker.PickerBuilder()
          .addView((window as any).google.picker.ViewId.DOCS)
          .setOAuthToken(accessToken!)
          .enableFeature((window as any).google.picker.Feature.MULTISELECT_ENABLED)
          .setCallback(async (data: any) => {
            if (data.action === 'picked') {
              const docs = data.docs;
              console.log(`Picked ${docs.length} files from Drive`);
              
              for (const doc of docs) {
                try {
                  const result = await knowledgeBaseApi.importFromGoogleDrive({
                    accessToken: accessToken!,
                    fileId: doc.id,
                    fileName: doc.name,
                    mimeType: doc.mimeType,
                    subjectId,
                  });
                  onImportComplete(result);
                } catch (err: any) {
                  console.error(`Import failed for ${doc.name}:`, err);
                }
              }
              
              setSuccessId('google_drive');
              setTimeout(() => setSuccessId(null), 3000);
            }
            if (data.action === 'cancel' || data.action === 'picked') {
              setLoading(null);
            }
          })
          .build();
        picker.setVisible(true);
      });
    } catch (err: any) {
      console.error('Drive import error:', err);
      setLoading(null);
    }
  };


  const [s3ModalOpen, setS3ModalOpen] = useState(false);
  const [s3Data, setS3Data] = useState({
    bucket: '',
    region: 'us-east-1',
    accessKey: '',
    secretKey: '',
    key: '',
  });

  const handleConnect = (sourceId: string) => {
    if (sourceId === 'google_drive') handleGoogleDrive();
    else if (sourceId === 's3') setS3ModalOpen(true);
  };

  const handleS3Import = async () => {
    if (!s3Data.bucket || !s3Data.key || !s3Data.accessKey || !s3Data.secretKey) {
      alert('Please fill in all S3 fields');
      return;
    }
    
    setLoading('s3');
    try {
      const result = await knowledgeBaseApi.importFromS3({
        bucket: s3Data.bucket,
        region: s3Data.region,
        accessKeyId: s3Data.accessKey,
        secretAccessKey: s3Data.secretKey,
        key: s3Data.key,
        subjectId: subjectId,
      });
      onImportComplete(result);
      setSuccessId('s3');
      setS3ModalOpen(false);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err: any) {
      alert(`S3 Import failed: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {SOURCES.map((src, i) => (
        <motion.div
          key={src.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className={`relative p-4 rounded-2xl border transition-all ${
            src.available
              ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/60 hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-md cursor-pointer'
              : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 opacity-60'
          }`}
        >
          {src.badge && (
            <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {src.badge}
            </span>
          )}

          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center shadow-sm">
              {src.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{src.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{src.description}</p>
            </div>
          </div>

          {src.available && (
            <Button
              size="sm"
              variant="flat"
              onClick={() => handleConnect(src.id)}
              isLoading={loading === src.id}
              startContent={
                successId === src.id ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : null
              }
              className={`w-full h-8 text-xs font-bold border rounded-xl transition-colors ${
                successId === src.id
                  ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {successId === src.id ? 'Imported!' : `Browse ${src.name}`}
            </Button>
          )}
        </motion.div>
      ))}
      {/* S3 Config Modal */}
      <Modal isOpen={s3ModalOpen} onClose={() => setS3ModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <S3Icon />
              <span className="font-black text-xl">Connect Amazon S3</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Bucket Name</label>
                  <input 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm"
                    placeholder="my-knowledge-bucket"
                    value={s3Data.bucket}
                    onChange={e => setS3Data({...s3Data, bucket: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Region</label>
                  <input 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm"
                    placeholder="us-east-1"
                    value={s3Data.region}
                    onChange={e => setS3Data({...s3Data, region: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Access Key ID</label>
                <input 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-mono"
                  placeholder="AKIA..."
                  value={s3Data.accessKey}
                  onChange={e => setS3Data({...s3Data, accessKey: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Secret Access Key</label>
                <input 
                  type="password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-mono"
                  placeholder="••••••••••••••••"
                  value={s3Data.secretKey}
                  onChange={e => setS3Data({...s3Data, secretKey: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Object Key (Path to File)</label>
                <input 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm"
                  placeholder="documents/lecture1.pdf"
                  value={s3Data.key}
                  onChange={e => setS3Data({...s3Data, key: e.target.value})}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setS3ModalOpen(false)} className="font-bold">Cancel</Button>
            <Button color="primary" onPress={handleS3Import} isLoading={loading === 's3'} className="font-black bg-blue-600">Import S3 File</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Toast */}
      <AnimatePresence>
        {successId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-6 right-6 z-[60]"
          >
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-xl border border-emerald-400/50">
              <div className="bg-white/20 p-1.5 rounded-full">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-black">Data Successfully Loaded!</p>
                <p className="text-[10px] opacity-90 font-semibold tracking-wide uppercase">Your knowledge base is being updated.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
