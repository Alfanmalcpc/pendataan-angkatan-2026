import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
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

// Konfigurasi Akun BAJA (SSO Google Login)
const bajaAuthConfig = {
  apiKey: "AIzaSyCka7K9HnZIEUpm1qlIFKB7ca43kNz8t74",
  authDomain: "baja-account.firebaseapp.com",
  databaseURL: "https://baja-account-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baja-account",
  storageBucket: "baja-account.firebasestorage.app",
  messagingSenderId: "829858667296",
  appId: "1:829858667296:web:2e968ca50c0f6b1838d545",
  measurementId: "G-RMHSJP0VH5"
};

// Konfigurasi Database NEVASTRA (Penyimpanan Biodata & Binding)
const nevastraDbConfig = {
  apiKey: "AIzaSyC97LwnbOMTAoN9bAPg78XedYlkBXH2_rA",
  authDomain: "nevastra.firebaseapp.com",
  databaseURL: "https://nevastra-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nevastra",
  storageBucket: "nevastra.firebasestorage.app",
  messagingSenderId: "464439721083",
  appId: "1:464439721083:web:6f91107a6a027103f076de",
  measurementId: "G-3S4QMH5W6T"
};

// Inisialisasi Apps
const authApp = getApps().find(a => a.name === "bajaAuth") || initializeApp(bajaAuthConfig, "bajaAuth");
const dbApp = getApps().find(a => a.name === "[DEFAULT]") || initializeApp(nevastraDbConfig);

const auth = getAuth(authApp);
const db = getDatabase(dbApp);
const googleProvider = new GoogleAuthProvider();

export async function saveBiodata(kelas, absen, studentData) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  const payload = {
    ...studentData,
    kelas: kelas,
    absen: parseInt(absen, 10),
    updatedAt: new Date().toISOString(),
    updatedAtFormatted: new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short"
    }).format(new Date())
  };
  await set(targetRef, payload);
  return payload;
}

export async function getStudentBiodata(kelas, absen) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  const snapshot = await get(targetRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getClassBiodata(kelas) {
  const classRef = ref(db, `biodata/${kelas}`);
  const snapshot = await get(classRef);
  return snapshot.exists() ? snapshot.val() : {};
}

export function listenClassBiodata(kelas, callback) {
  const classRef = ref(db, `biodata/${kelas}`);
  return onValue(classRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

export function listenAllBiodata(callback) {
  const allRef = ref(db, "biodata");
  return onValue(allRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

export async function deleteStudentBiodata(kelas, absen) {
  const targetRef = ref(db, `biodata/${kelas}/${absen}`);
  await remove(targetRef);
}

export { 
  authApp,
  dbApp,
  db, 
  ref, 
  set,
  get,
  remove,
  onValue,
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  bajaAuthConfig,
  nevastraDbConfig
};
