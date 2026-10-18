import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const expectedFirebaseConfig = {
  apiKey: "AIzaSyDpKbct503ARyZHYd-YiPS9Qfg3VcbL3eE",
  authDomain: "yusuf-clothing-line.firebaseapp.com",
  projectId: "yusuf-clothing-line",
  storageBucket: "yusuf-clothing-line.firebasestorage.app",
  messagingSenderId: "531992782883",
  appId: "1:531992782883:web:7d38e73ae99a371666e996",
  measurementId: "G-C8V6DN1C4J",
};

const configuredValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Fail closed if deployment variables still point at The Plug, Africhiko, or another project.
const matchesYusufProject = Object.entries(expectedFirebaseConfig).every(([key, expected]) =>
  configuredValues[key as keyof typeof expectedFirebaseConfig] === expected
);
export const hasFirebaseWebConfig = matchesYusufProject;

const firebaseConfig = hasFirebaseWebConfig
  ? configuredValues
  : {
      apiKey: "build-placeholder",
      authDomain: "build-placeholder.firebaseapp.com",
      projectId: "build-placeholder",
      storageBucket: "build-placeholder.appspot.com",
      messagingSenderId: "build-placeholder",
      appId: "build-placeholder",
      measurementId: undefined,
    };

const app = getApps().length ? getApps().find(candidate => candidate.options.projectId === firebaseConfig.projectId) || initializeApp(firebaseConfig) : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);
export { app };
