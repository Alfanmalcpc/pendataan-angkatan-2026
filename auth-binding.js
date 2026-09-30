// auth-binding.js — Modul SSO Auth Bajza & Penautan Profil Siswa NEVASTRA 2026
// Additive & Modular: Mengintegrasikan Google Sign-In, Double Confirmation Modal, dan Sistem Aju Banding

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  ref, 
  set, 
  get, 
  remove, 
  onValue 
} from './firebase-config.js';

// Database Operations
export async function getStudentBinding(kelas, absen) {
  try {
    const bindingRef = ref(db, `auth_bindings/${kelas}_${absen}`);
    const snapshot = await get(bindingRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn("Gagal membaca binding siswa:", err);
    return null;
  }
}

export async function getUserBinding(uid) {
  try {
    const userRef = ref(db, `user_to_student/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn("Gagal membaca data siswa dari user:", err);
    return null;
  }
}

export async function bindStudentToUser(kelas, absen, namaSiswa, user) {
  const bindingData = {
    kelas: kelas,
    absen: parseInt(absen, 10),
    nama: namaSiswa,
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || namaSiswa,
    photoURL: user.photoURL || '',
    linkedAt: new Date().toISOString(),
    linkedAtFormatted: new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date())
  };

  const userMapping = {
    kelas: kelas,
    absen: parseInt(absen, 10),
    studentKey: `${kelas}_${absen}`,
    nama: namaSiswa,
    email: user.email,
    linkedAt: bindingData.linkedAt
  };

  await set(ref(db, `auth_bindings/${kelas}_${absen}`), bindingData);
  await set(ref(db, `user_to_student/${user.uid}`), userMapping);
  return bindingData;
}

export async function unlinkStudentBinding(kelas, absen, uid) {
  await remove(ref(db, `auth_bindings/${kelas}_${absen}`));
  if (uid) {
    await remove(ref(db, `user_to_student/${uid}`));
  }
}

export async function submitStudentAppeal(appealData) {
  const appealId = `${appealData.kelas}_${appealData.absen}_${Date.now()}`;
  const payload = {
    ...appealData,
    appealId: appealId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    createdAtFormatted: new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date())
  };
  await set(ref(db, `appeals/${appealId}`), payload);
  return payload;
}

// Inisialisasi UI Penautan di Halaman Kelas (xii-1 s/d xii-9)
export function setupClassAuthBinding(options) {
  const {
    kelas,
    selectAbsenNama,
    studentForm,
    btnSubmit,
    classRoster,
    onStudentUnlocked,
    onStudentLocked
  } = options;

  let currentUser = null;
  let activeStudentBinding = null;
  let userOwnBinding = null;

  // 1. Injeksi Style Tambahan (Glassmorphism & Clean Modals)
  if (!document.getElementById('authBindingStyles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'authBindingStyles';
    styleEl.textContent = `
      .auth-gate-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 248, 255, 0.9));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1.5px solid rgba(57, 183, 187, 0.3);
        border-radius: var(--radius-lg, 16px);
        padding: 18px 24px;
        margin-bottom: 24px;
        box-shadow: 0 10px 30px -8px rgba(15, 23, 42, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        transition: all 0.3s ease;
      }
      .auth-gate-info {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .auth-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid var(--primary, #39b7bb);
        box-shadow: 0 4px 10px rgba(57, 183, 187, 0.25);
        object-fit: cover;
      }
      .auth-avatar-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-size: 1.3rem;
      }
      .auth-btn-google {
        background: #ffffff;
        color: #1e293b;
        border: 1.5px solid #cbd5e1;
        padding: 10px 18px;
        border-radius: var(--radius-md, 12px);
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
      }
      .auth-btn-google:hover {
        background: #f8fafc;
        border-color: #94a3b8;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
      .auth-btn-signout {
        background: transparent;
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .auth-btn-signout:hover {
        background: #fef2f2;
        border-color: #ef4444;
      }

      /* Modal Popups */
      .auth-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
        box-sizing: border-box;
      }
      .auth-modal-card {
        background: #ffffff;
        width: 100%;
        max-width: 520px;
        border-radius: 20px;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
        border: 1px solid #e2e8f0;
        overflow: hidden;
        animation: authModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes authModalIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .auth-modal-header {
        padding: 20px 24px 16px 24px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .auth-modal-body {
        padding: 24px;
      }
      .auth-modal-footer {
        padding: 16px 24px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .badge-binding {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.76rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
      }
      .badge-binding.bound-you {
        background: #dcfce7;
        color: #15803d;
      }
      .badge-binding.bound-other {
        background: #fee2e2;
        color: #b91c1c;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 2. Buat Elemen Auth Gate Bar (Dipasang di atas hero atau progress bar secara additive)
  const authBar = document.createElement('div');
  authBar.className = 'auth-gate-card';
  authBar.id = 'authGateCard';
  authBar.innerHTML = `
    <div class="auth-gate-info" id="authGateInfo">
      <div class="auth-avatar-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
      </div>
      <div>
        <h4 style="font-size: 0.98rem; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
          Wajib Masuk dengan Akun Google / Bajza
        </h4>
        <p style="font-size: 0.82rem; color: #64748b; margin: 0;" id="authGateSubtext">
          Masuk akun untuk menautkan biodata resmi Anda dan menjaga keamanan data.
        </p>
      </div>
    </div>
    <div id="authGateAction">
      <button class="auth-btn-google" id="btnAuthSignIn">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
        </svg>
        <span>Masuk Akun Google</span>
      </button>
    </div>
  `;

  // Sisipkan tepat di atas hero-banner atau class progress
  const targetParent = document.querySelector('.main-wrapper') || document.body;
  if (targetParent.firstChild) {
    targetParent.insertBefore(authBar, targetParent.firstChild);
  } else {
    targetParent.appendChild(authBar);
  }

  // 3. Modal Konfirmasi Penautan Akun
  const modalConfirm = document.createElement('div');
  modalConfirm.className = 'auth-modal-overlay';
  modalConfirm.id = 'modalConfirmBinding';
  modalConfirm.innerHTML = `
    <div class="auth-modal-card">
      <div class="auth-modal-header">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>🔒</span> Konfirmasi Penautan Akun Siswa
        </h3>
        <button type="button" id="btnCancelBindingCorner" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #94a3b8;">&times;</button>
      </div>
      <div class="auth-modal-body">
        <p style="font-size: 0.9rem; color: #475569; margin-bottom: 16px;">
          Apakah Anda yakin ingin menautkan profil siswa berikut ke akun Google Anda saat ini?
        </p>
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 16px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary, #39b7bb); text-transform: uppercase;">PROFIL SISWA TERPILIH</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;" id="bindModalNamaSiswa">-</div>
          <div style="font-size: 0.85rem; color: #64748b;" id="bindModalKelasAbsen">-</div>
        </div>
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-bottom: 16px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #2563eb; text-transform: uppercase;">TERTAUT KE AKUN ANDA</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #1e3a8a;" id="bindModalEmailUser">-</div>
        </div>
        <div style="font-size: 0.82rem; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px;">
          ⚠️ <strong>Penting:</strong> Setelah ditautkan, profil ini hanya dapat diubah oleh akun Google Anda. Pastikan tidak salah memilih nama teman Anda.
        </div>
      </div>
      <div class="auth-modal-footer">
        <button type="button" class="btn btn-outline btn-sm" id="btnCancelBinding">Batal & Pilih Ulang</button>
        <button type="button" class="btn btn-primary btn-sm" id="btnConfirmBinding" style="font-weight: 700;">Ya, Tautkan Akun Saya</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalConfirm);

  // 4. Modal Aju Banding (Jika Akun Sudah Diklaim Orang Lain)
  const modalAppeal = document.createElement('div');
  modalAppeal.className = 'auth-modal-overlay';
  modalAppeal.id = 'modalAppeal';
  modalAppeal.innerHTML = `
    <div class="auth-modal-card">
      <div class="auth-modal-header">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #b91c1c; margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>⚖️</span> Form Aju Banding Akun Siswa
        </h3>
        <button type="button" id="btnCancelAppealCorner" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #94a3b8;">&times;</button>
      </div>
      <div class="auth-modal-body">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 0.85rem; color: #991b1b;">
          Profil <strong><span id="appealNamaSiswa">-</span></strong> saat ini telah tertaut ke email lain (<span id="appealCurrentEmail">-</span>). Jika Anda adalah pemilik asli profil ini, silakan ajukan banding ke Admin.
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label style="font-size: 0.85rem; font-weight: 700;">Nomor WhatsApp Anda (Wajib) <span class="req">*</span></label>
          <input type="tel" id="appealNoWa" class="form-control" placeholder="Contoh: 081234567890" required>
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label style="font-size: 0.85rem; font-weight: 700;">Alasan Aju Banding <span class="req">*</span></label>
          <textarea id="appealAlasan" class="form-control" rows="3" placeholder="Jelaskan secara singkat (contoh: Nama saya keliru dipilih oleh teman sekelas)..." required></textarea>
        </div>
        <div style="font-size: 0.78rem; color: #64748b;">
          Pengajuan banding akan langsung masuk ke Dashboard Admin untuk ditinjau dan dikonfirmasi.
        </div>
      </div>
      <div class="auth-modal-footer">
        <button type="button" class="btn btn-outline btn-sm" id="btnCancelAppeal">Tutup</button>
        <button type="button" class="btn btn-sm" id="btnSubmitAppeal" style="background: #e11d48; color: white; font-weight: 700;">Kirim Aju Banding</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalAppeal);

  // 5. Modal Wajib Login Google Langsung (Muncul seketika saat baru buka link jika belum login)
  const modalRequireLogin = document.createElement('div');
  modalRequireLogin.className = 'auth-modal-overlay';
  modalRequireLogin.id = 'modalRequireLogin';
  modalRequireLogin.innerHTML = `
    <div class="auth-modal-card" style="text-align: center; max-width: 420px; padding: 34px 28px;">
      <div style="width: 68px; height: 68px; margin: 0 auto 16px; border-radius: 20px; background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(67, 97, 238, 0.4);">
        <img src="logo.svg" alt="NEVASTRA" style="width: 40px; height: 40px; object-fit: contain;">
      </div>
      <span style="font-size: 0.72rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #4361ee; background: #eef2ff; padding: 4px 12px; border-radius: 999px; display: inline-block; margin-bottom: 12px;">
        SSO GOOGLE • KELAS ${kelas}
      </span>
      <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">
        Wajib Masuk Akun Google
      </h3>
      <p style="font-size: 0.88rem; color: #64748b; margin: 0 0 22px 0; line-height: 1.5;">
        Untuk mengisi, memilih nama, atau memperbarui biodata buku tahunan, Anda wajib masuk dengan akun Google terlebih dahulu.
      </p>
      <button id="btnModalRequireGoogleLogin" type="button" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.06); margin-bottom: 14px;">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24Z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/></svg>
        <span id="btnModalRequireGoogleText">Lanjutkan dengan Google</span>
      </button>
      <a href="index.html" class="btn btn-outline btn-sm" style="font-size: 0.8rem; color: #64748b; text-decoration: none; display: inline-block;">
        ← Kembali ke Portal Utama
      </a>
      <div id="modalRequireLoginError" style="margin-top: 10px; font-size: 0.78rem; color: #dc2626; display: none;"></div>
    </div>
  `;
  document.body.appendChild(modalRequireLogin);

  const btnModalRequireGoogleLogin = document.getElementById('btnModalRequireGoogleLogin');
  const btnModalRequireGoogleText = document.getElementById('btnModalRequireGoogleText');
  const modalRequireLoginError = document.getElementById('modalRequireLoginError');

  btnModalRequireGoogleLogin.addEventListener('click', async () => {
    btnModalRequireGoogleLogin.disabled = true;
    btnModalRequireGoogleText.textContent = "Membuka jendela Google...";
    modalRequireLoginError.style.display = 'none';
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in modal error:", err);
      btnModalRequireGoogleLogin.disabled = false;
      btnModalRequireGoogleText.textContent = "Lanjutkan dengan Google";
      modalRequireLoginError.textContent = "Gagal login: " + (err.message || err.code);
      modalRequireLoginError.style.display = 'block';
    }
  });

  // Helper Elements
  const btnAuthSignIn = document.getElementById('btnAuthSignIn');
  const authGateInfo = document.getElementById('authGateInfo');
  const authGateAction = document.getElementById('authGateAction');

  const btnConfirmBinding = document.getElementById('btnConfirmBinding');
  const btnCancelBinding = document.getElementById('btnCancelBinding');
  const btnCancelBindingCorner = document.getElementById('btnCancelBindingCorner');

  const btnSubmitAppeal = document.getElementById('btnSubmitAppeal');
  const btnCancelAppeal = document.getElementById('btnCancelAppeal');
  const btnCancelAppealCorner = document.getElementById('btnCancelAppealCorner');

  // Lock or Unlock Form
  function setFormLockedState(locked, reason = "") {
    const inputs = studentForm.querySelectorAll('input:not(#selectAbsenNama), textarea, select:not(#selectAbsenNama)');
    inputs.forEach(el => {
      el.disabled = locked;
      el.style.opacity = locked ? '0.6' : '1';
    });
    if (btnSubmit) {
      btnSubmit.disabled = locked;
      if (locked && reason) {
        btnSubmit.setAttribute('data-original-text', btnSubmit.innerHTML);
        btnSubmit.innerHTML = reason;
      }
    }
  }

  // Default lock until user logs in
  setFormLockedState(true, "🔒 Wajib Masuk Akun Google untuk Mengisi");
  if (selectAbsenNama) selectAbsenNama.disabled = true;

  // Sign In Click
  btnAuthSignIn.addEventListener('click', async () => {
    btnAuthSignIn.disabled = true;
    btnAuthSignIn.innerHTML = `<span>Membuka jendela Google...</span>`;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in error:", err);
      btnAuthSignIn.disabled = false;
      btnAuthSignIn.innerHTML = `<span>Coba Masuk Lagi</span>`;
      alert("Gagal masuk dengan Google: " + (err.message || err.code));
    }
  });

  // Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      userOwnBinding = null;
      activeStudentBinding = null;
      if (selectAbsenNama) {
        selectAbsenNama.disabled = true;
        selectAbsenNama.value = "";
      }
      setFormLockedState(true, "🔒 Wajib Masuk Akun Google untuk Mengisi");
      modalRequireLogin.classList.add('show');

      authGateInfo.innerHTML = `
        <div class="auth-avatar-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
        </div>
        <div>
          <h4 style="font-size: 0.98rem; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
            Wajib Masuk dengan Akun Google / Bajza
          </h4>
          <p style="font-size: 0.82rem; color: #64748b; margin: 0;">
            Masuk akun untuk menautkan biodata resmi Anda dan menjaga keamanan data.
          </p>
        </div>
      `;
      authGateAction.innerHTML = `
        <button class="auth-btn-google" id="btnAuthSignIn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24Z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/>
          </svg>
          <span>Masuk Akun Google</span>
        </button>
      `;
      document.getElementById('btnAuthSignIn').onclick = () => signInWithPopup(auth, googleProvider);
      return;
    }

    // User is logged in!
    currentUser = user;
    modalRequireLogin.classList.remove('show');
    if (selectAbsenNama) selectAbsenNama.disabled = false;

    const photoUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=39b7bb&color=fff`;

    authGateInfo.innerHTML = `
      <img src="${photoUrl}" alt="Avatar" class="auth-avatar">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <h4 style="font-size: 0.98rem; font-weight: 800; color: #0f172a; margin: 0;">
            ${user.displayName || 'Akun Google'}
          </h4>
          <span class="badge-status success" style="font-size: 0.72rem; padding: 2px 8px;">Akun Aktif</span>
        </div>
        <p style="font-size: 0.82rem; color: #64748b; margin: 2px 0 0 0;" id="authGateUserEmail">
          ${user.email}
        </p>
      </div>
    `;

    authGateAction.innerHTML = `
      <button class="auth-btn-signout" id="btnAuthSignOut">
        Keluar Akun
      </button>
    `;
    document.getElementById('btnAuthSignOut').onclick = async () => {
      await signOut(auth);
    };

    // Cek apakah user ini sudah pernah menautkan profil siswa sebelumnya
    userOwnBinding = await getUserBinding(user.uid);
    if (userOwnBinding && userOwnBinding.kelas === kelas && selectAbsenNama) {
      // Otomatis pilih absen siswa milik user ini
      if (selectAbsenNama.value != userOwnBinding.absen) {
        selectAbsenNama.value = userOwnBinding.absen;
        selectAbsenNama.dispatchEvent(new Event('change'));
      }
    }
  });

  // Handle Absen Change with Binding Verification
  let pendingAbsen = null;
  let pendingStudent = null;

  async function handleSelectionBinding(absen) {
    if (!currentUser) {
      alert("Silakan masuk akun Google terlebih dahulu.");
      return false;
    }

    const student = classRoster.find(s => s.absen == absen);
    if (!student) return false;

    // Cek di Firebase apakah siswa ini sudah tertaut akun
    const existingBinding = await getStudentBinding(kelas, absen);
    activeStudentBinding = existingBinding;

    if (!existingBinding) {
      // KASUS 1: BELUM TERTAUT -> MUNCULKAN POPUP KONFIRMASI GANDA
      pendingAbsen = absen;
      pendingStudent = student;

      document.getElementById('bindModalNamaSiswa').textContent = student.nama;
      document.getElementById('bindModalKelasAbsen').textContent = `Kelas ${kelas} • Nomor Absen ${absen}`;
      document.getElementById('bindModalEmailUser').textContent = `${currentUser.displayName || ''} (${currentUser.email})`;
      modalConfirm.style.display = 'flex';
      return 'pending_confirm';
    }

    // KASUS 2: SUDAH TERTAUT
    if (existingBinding.uid === currentUser.uid) {
      // COCOK: Akun ini adalah pemilik profil siswa ini
      setFormLockedState(false);
      if (typeof onStudentUnlocked === 'function') onStudentUnlocked(student, existingBinding);
      return true;
    } else {
      // TIDAK COCOK: Profil siswa ini sudah diklaim oleh akun lain!
      setFormLockedState(true, "🔒 Profil Telah Tertaut dengan Akun Lain");
      if (typeof onStudentLocked === 'function') onStudentLocked(student, existingBinding);

      // Siapkan modal aju banding
      pendingAbsen = absen;
      pendingStudent = student;
      document.getElementById('appealNamaSiswa').textContent = `${student.nama} (Absen ${absen})`;
      document.getElementById('appealCurrentEmail').textContent = existingBinding.email || 'Akun Lain';

      const wantAppeal = confirm(
        `⚠️ Peringatan: Profil ${student.nama} (Absen ${absen}) telah tertaut ke akun lain (${existingBinding.email}).\n\nJika ini adalah data Anda yang keliru diklaim orang lain, klik OK untuk mengajukan banding ke Admin.`
      );
      if (wantAppeal) {
        modalAppeal.style.display = 'flex';
      }
      return false;
    }
  }

  // Hook Event Selection
  if (selectAbsenNama) {
    const originalOnChange = selectAbsenNama.onchange;
    selectAbsenNama.addEventListener('change', async (e) => {
      const val = selectAbsenNama.value;
      if (!val) return;
      const status = await handleSelectionBinding(val);
      if (status === 'pending_confirm') {
        // Jangan lanjut sampai modal dikonfirmasi
        e.stopImmediatePropagation();
      }
    }, true);
  }

  // Modal Confirm Binding Buttons
  btnConfirmBinding.onclick = async () => {
    if (!pendingAbsen || !pendingStudent || !currentUser) return;
    btnConfirmBinding.disabled = true;
    btnConfirmBinding.textContent = "Menautkan...";

    try {
      await bindStudentToUser(kelas, pendingAbsen, pendingStudent.nama, currentUser);
      userOwnBinding = { kelas, absen: pendingAbsen, studentKey: `${kelas}_${pendingAbsen}` };
      modalConfirm.style.display = 'none';
      btnConfirmBinding.disabled = false;
      btnConfirmBinding.textContent = "Ya, Tautkan Akun Saya";

      setFormLockedState(false);
      alert(`✅ Berhasil! Akun ${currentUser.email} telah resmi ditautkan ke profil ${pendingStudent.nama} (${kelas} Absen ${pendingAbsen}).`);

      // Trigger change event agar data form termuat
      selectAbsenNama.dispatchEvent(new Event('change'));
    } catch (err) {
      console.error("Gagal menautkan akun:", err);
      alert("Terjadi kesalahan saat menautkan akun: " + err.message);
      btnConfirmBinding.disabled = false;
      btnConfirmBinding.textContent = "Ya, Tautkan Akun Saya";
    }
  };

  const closeConfirmModal = () => {
    modalConfirm.style.display = 'none';
    if (selectAbsenNama && (!activeStudentBinding || activeStudentBinding.uid !== (currentUser && currentUser.uid))) {
      selectAbsenNama.value = "";
      setFormLockedState(true);
    }
  };
  btnCancelBinding.onclick = closeConfirmModal;
  btnCancelBindingCorner.onclick = closeConfirmModal;

  // Modal Appeal Buttons
  btnSubmitAppeal.onclick = async () => {
    const noWa = document.getElementById('appealNoWa').value.trim();
    const alasan = document.getElementById('appealAlasan').value.trim();

    if (!noWa || !alasan) {
      alert("Mohon isi nomor WhatsApp dan alasan aju banding secara lengkap!");
      return;
    }

    btnSubmitAppeal.disabled = true;
    btnSubmitAppeal.textContent = "Mengirim...";

    try {
      await submitStudentAppeal({
        kelas: kelas,
        absen: pendingAbsen,
        namaSiswa: pendingStudent ? pendingStudent.nama : '',
        claimedByUid: currentUser.uid,
        claimedByEmail: currentUser.email,
        claimedByName: currentUser.displayName || '',
        currentLinkedEmail: activeStudentBinding ? activeStudentBinding.email : '',
        currentLinkedUid: activeStudentBinding ? activeStudentBinding.uid : '',
        noWa: noWa,
        alasan: alasan
      });

      modalAppeal.style.display = 'none';
      btnSubmitAppeal.disabled = false;
      btnSubmitAppeal.textContent = "Kirim Aju Banding";
      alert("✅ Pengajuan banding berhasil dikirimkan ke Admin! Admin akan meninjau dan mengonfirmasi pelepasan akun.");
      if (selectAbsenNama) selectAbsenNama.value = "";
    } catch (err) {
      console.error("Gagal mengirim appeal:", err);
      alert("Gagal mengirimkan aju banding: " + err.message);
      btnSubmitAppeal.disabled = false;
      btnSubmitAppeal.textContent = "Kirim Aju Banding";
    }
  };

  const closeAppealModal = () => {
    modalAppeal.style.display = 'none';
    if (selectAbsenNama) selectAbsenNama.value = "";
  };
  btnCancelAppeal.onclick = closeAppealModal;
  btnCancelAppealCorner.onclick = closeAppealModal;
}
