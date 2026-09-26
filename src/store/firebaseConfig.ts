import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC8Vd26qGXmgQhicGwma0WLJjZkkESu8fI',
  authDomain: 'shreyansh-group.firebaseapp.com',
  projectId: 'shreyansh-group',
  storageBucket: 'shreyansh-group.firebasestorage.app',
  messagingSenderId: '802068971313',
  appId: '1:802068971313:web:60031ed28cc9e46871fa10',
  measurementId: 'G-6F881W7EMC',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
