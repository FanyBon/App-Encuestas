import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAt2AEzaUwV3felOGmh32KWX-d_rjilXjs",
  authDomain: "webapp-d30d6.firebaseapp.com",
  projectId: "webapp-d30d6",
  storageBucket: "webapp-d30d6.firebasestorage.app",
  messagingSenderId: "359617793734",
  appId: "1:359617793734:web:9848a975236ca85dfc11c7",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);