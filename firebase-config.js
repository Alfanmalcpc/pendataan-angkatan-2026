import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  remove 
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC97LwnbOMTAoN9bAPg78XedYlkBXH2_rA",
  authDomain: "nevastra.firebaseapp.com",
  databaseURL: "https://nevastra-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nevastra",
  storageBucket: "nevastra.firebasestorage.app",
  messagingSenderId: "464439721083",
  appId: "1:464439721083:web:6f91107a6a027103f076de",
  measurementId: "G-3S4QMH5W6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Save or update student biodata
export async function saveBiodata(kelas, absen, studentData) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  const payload = {
    ...studentData,
    kelas: kelas,
    absen: parseInt(absen, 10),
    updatedAt: new Date().toISOString(),
    updatedAtFormatted: new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date())
  };
  await set(targetRef, payload);
  return payload;
}

// Get single student biodata
export async function getStudentBiodata(kelas, absen) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  const snapshot = await get(targetRef);
  return snapshot.exists() ? snapshot.val() : null;
}

// Get all biodata for a class
export async function getClassBiodata(kelas) {
  const classRef = ref(db, `biodata/${kelas}`);
  const snapshot = await get(classRef);
  return snapshot.exists() ? snapshot.val() : {};
}

// Real-time listener for class biodata
export function listenClassBiodata(kelas, callback) {
  const classRef = ref(db, `biodata/${kelas}`);
  return onValue(classRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

// Real-time listener for all angkatan biodata
export function listenAllBiodata(callback) {
  const allRef = ref(db, `biodata`);
  return onValue(allRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

// Delete student biodata (admin function)
export async function deleteStudentBiodata(kelas, absen) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  await remove(targetRef);
}

export { 
  app, 
  db, 
  ref, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  firebaseConfig 
};
