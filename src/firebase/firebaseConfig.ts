import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, setDoc, getDoc };
export const groupsCollection = collection(db, 'groups');
export const usersCollection = collection(db, 'users');

export const encryptData = (data: any, secret: string): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
};

export const decryptData = (ciphertext: string, secret: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed - empty result');
    }
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
