import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCE738FcXIurL_dfShelrfCZjEc4ZIGxu4",
  authDomain: "ecommerce-d7f6e.firebaseapp.com",
  databaseURL: "https://ecommerce-d7f6e-default-rtdb.firebaseio.com",
  projectId: "ecommerce-d7f6e",
  storageBucket: "ecommerce-d7f6e.firebasestorage.app",
  messagingSenderId: "108611116550",
  appId: "1:108611116550:web:1d5a800e6af021c8826d87",
  measurementId: "G-0ZP2LPPWNS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
