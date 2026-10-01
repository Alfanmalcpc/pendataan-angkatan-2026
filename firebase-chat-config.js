// firebase-chat-config.js — Firebase Live Chat NEVASTRA 2026
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  get, 
  onValue, 
  limitToLast, 
  query, 
  remove,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { auth, onAuthStateChanged, db as nevastraDb, googleProvider, signInWithPopup } from "./firebase-config.js";

const chatFirebaseConfig = {
  apiKey: "AIzaSyBd1o21D0cZlhWNXpOszQaGiRA7ofwQ_yQ",
  authDomain: "chat-nevastra.firebaseapp.com",
  databaseURL: "https://chat-nevastra-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-nevastra",
  storageBucket: "chat-nevastra.firebasestorage.app",
  messagingSenderId: "844988002893",
  appId: "1:844988002893:web:4b215012c5b64aed496204",
  measurementId: "G-ZJP93EBGZL"
};

// Inisialisasi Firebase App khusus Chat RTDB
const chatApp = getApps().find(a => a.name === "chatApp") || initializeApp(chatFirebaseConfig, "chatApp");
const chatDb = getDatabase(chatApp);

export {
  chatApp,
  chatDb,
  ref,
  push,
  set,
  get,
  onValue,
  limitToLast,
  query,
  remove,
  serverTimestamp,
  auth,
  onAuthStateChanged,
  nevastraDb,
  googleProvider,
  signInWithPopup
};
