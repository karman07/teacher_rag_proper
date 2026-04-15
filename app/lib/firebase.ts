import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:      process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId:       process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Prevent re-initialising on hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add Google Drive readonly scope
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
// Optional: Prompt user to select account every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
