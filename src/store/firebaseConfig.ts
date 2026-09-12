// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyC8Vd26qGXmgQhicGwma0WLJjZkkESu8fI',
  authDomain: 'shreyansh-group.firebaseapp.com',
  projectId: 'shreyansh-group',
  storageBucket: 'shreyansh-group.firebasestorage.app',
  messagingSenderId: '802068971313',
  appId: '1:802068971313:web:60031ed28cc9e46871fa10',
  measurementId: 'G-6F881W7EMC',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and export it for your RTK Query slice
export const db = getFirestore(app);
