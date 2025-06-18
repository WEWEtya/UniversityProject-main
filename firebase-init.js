// firebase-init.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDOEw637PRRVQRfilZ_6ErN40kVcgKeLy0",
  authDomain: "main-f43a3.firebaseapp.com",
  projectId: "main-f43a3",
  storageBucket: "main-f43a3.appspot.com",
  messagingSenderId: "326850620017",
  appId: "1:326850620017:web:fa1c74c3c7ba21b5f109d0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
