import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAt2AEzaUwV3felOGmh32KWX-d_rjilXjs',
  authDomain: 'webapp-d30d6.firebaseapp.com',
  projectId: 'webapp-d30d6',
  storageBucket: 'webapp-d30d6.firebasestorage.app',
  messagingSenderId: '359617793734',
  appId: '1:359617793734:web:9848a975236ca85dfc11c7',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
