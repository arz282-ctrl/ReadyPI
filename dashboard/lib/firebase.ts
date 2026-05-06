/**
 * Firebase Client SDK Configuration
 *
 * Initializes Firebase Auth for the ReadyPI dashboard.
 * All config values are read from NEXT_PUBLIC_ environment variables.
 * Never import Firebase Admin SDK here — this runs in the browser.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is actually configured with valid API key
// The placeholder 'your_api_key_here' is used in .env.example to detect unconfigured state
const isFirebaseConfigured = !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.apiKey.length > 20; // Real API keys are longer

// Singleton initialization — conditionally initialize to prevent invalid API key errors
let app: FirebaseApp | undefined = undefined;
let auth: Auth | any = undefined;
let googleProvider: GoogleAuthProvider | any = undefined;
let githubProvider: GithubAuthProvider | any = undefined;
let facebookProvider: FacebookAuthProvider | any = undefined;
let appleProvider: OAuthProvider | any = undefined;

// Log configuration status for debugging
if (typeof window !== 'undefined') {
  console.log('[Firebase] Configuration check:', {
    isConfigured: isFirebaseConfigured,
    hasApiKey: !!firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
  });
}

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // OAuth providers — only initialize when Firebase is configured
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  githubProvider = new GithubAuthProvider();
  githubProvider.addScope('read:user');
  githubProvider.addScope('user:email');

  facebookProvider = new FacebookAuthProvider();

  appleProvider = new OAuthProvider('apple.com');
  appleProvider.addScope('email');
  appleProvider.addScope('name');
} else {
  // Provide dummy objects to prevent import errors
  console.warn('[Firebase] OAuth providers disabled - Firebase not configured. Please check NEXT_PUBLIC_FIREBASE_API_KEY.');
  auth = {} as Auth;
  googleProvider = {} as GoogleAuthProvider;
  githubProvider = {} as GithubAuthProvider;
  facebookProvider = {} as FacebookAuthProvider;
  appleProvider = {} as OAuthProvider;
}

export {
  app,
  auth,
  googleProvider,
  githubProvider,
  facebookProvider,
  appleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  isFirebaseConfigured
};
export type { User };
