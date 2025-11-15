import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBasTPbNwA8XGqxW1wtqSg3T4JOjURCNLI",
  authDomain: "amigoes-a43ac.firebaseapp.com",
  projectId: "amigoes-a43ac",
  storageBucket: "amigoes-a43ac.firebasestorage.app",
  messagingSenderId: "473655661891",
  appId: "1:473655661891:web:30ee4e00b7ea004ded8bf6",
  measurementId: "G-L0M1F1F46R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 👇 THIS is the named export that login.tsx will import
export const auth = getAuth(app);
export const db = getFirestore(app);
