// auth-binding.js — Modul SSO Auth Bajza & Penautan Profil Siswa NEVASTRA 2026
// Additive & Modular: Mengintegrasikan Google Sign-In, Double Confirmation Modal, dan Sistem Aju Banding
// Semua database dibebankan 100% ke database data (nevastra-default-rtdb), akun Bajza khusus untuk Google Auth.

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

// Database Operations (Tersimpan 100% di Database NEVASTRA)
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
  const nowIso = new Date().toISOString();
  const nowFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date());

  const bindingData = {
    kelas: kelas,
    absen: parseInt(absen, 10),
    nama: namaSiswa,
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || namaSiswa,
    photoURL: user.photoURL || '',
    linkedAt: nowIso,
    linkedAtFormatted: nowFormatted
  };

  const userMapping = {
    kelas: kelas,
    absen: parseInt(absen, 10),
    studentKey: `${kelas}_${absen}`,
    nama: namaSiswa,
    email: user.email,
    linkedAt: nowIso
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
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: var(--radius-lg, 16px);
        padding: 16px 20px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
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
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        padding: 20px;
        box-sizing: border-box;
      }
      .auth-modal-overlay.show {
        display: flex !important;
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
      .locked-badge-box {
        margin-top: 8px;
        font-size: 0.83rem;
        font-weight: 700;
        color: #1e40af;
        background: #eff6ff;
        border: 1.5px solid #bfdbfe;
        border-radius: 10px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // 2. Buat Elemen Auth Gate Bar (Dipasang di atas form secara additive)
  const authBar = document.createElement('div');
  authBar.className = 'auth-gate-card';
  authBar.id = 'authGateCard';
  authBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <a href="index.html" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.04);" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#94a3b8';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#cbd5e1';">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span>Kembali ke Halaman Utama</span>
      </a>
      <a href="kaos-ttd.html" id="linkAuthKaosTtd" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; background: #eef2ff; color: #4338ca; border: 1.5px solid #c7d2fe; padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 2px 5px rgba(79,70,229,0.06);" onmouseover="this.style.background='#e0e7ff'" onmouseout="this.style.background='#eef2ff'">
        <span>👕✍️</span>
        <span>Ukuran Kaos & TTD</span>
      </a>
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
          ⚠️ <strong>Penting:</strong> Setelah ditautkan, nomor absen & profil ini akan terkunci permanen untuk akun Google Anda dan tidak dapat diubah ke nama orang lain.
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

  // 5. Modal Wajib Login Google Langsung (Barrier jika belum login)
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
        Untuk mengisi, melihat data, dan mengunci identitas buku tahunan Anda, Anda wajib masuk dengan akun Google terlebih dahulu.
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

  // 6. Elemen Notifikasi Terkunci di Bawah Select Absen
  let lockBadge = document.getElementById('selectAbsenLockNotice');
  if (!lockBadge && selectAbsenNama && selectAbsenNama.parentNode) {
    lockBadge = document.createElement('div');
    lockBadge.id = 'selectAbsenLockNotice';
    lockBadge.className = 'locked-badge-box';
    lockBadge.style.display = 'none';
    selectAbsenNama.parentNode.insertBefore(lockBadge, selectAbsenNama.nextSibling);
  }

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

  // Lock or Unlock Form Inputs (KECUALI selectAbsenNama yang diatur secara terpisah)
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
      } else {
        const orig = btnSubmit.getAttribute('data-original-text');
        if (orig) btnSubmit.innerHTML = orig;
      }
    }
  }

  // FUNGSI INTI: Muat & Tampilkan Data Siswa dari Database NEVASTRA
  async function loadAndDisplayStudentData(absen) {
    if (!absen) return;
    const student = classRoster.find(s => s.absen == absen);
    const defaultNama = student ? student.nama : '';

    let saved = null;
    try {
      if (window.NevastraDB && typeof window.NevastraDB.getStudentBiodata === 'function') {
        saved = await window.NevastraDB.getStudentBiodata(kelas, absen);
      } else {
        const snap = await get(ref(db, `biodata/${kelas}/${absen}`));
        saved = snap.exists() ? snap.val() : null;
      }
    } catch (e) {
      console.warn("Gagal memuat biodata siswa:", e);
    }

    const inputNama = document.getElementById('inputNama');
    const inputTempatLahir = document.getElementById('inputTempatLahir');
    const inputTanggalLahir = document.getElementById('inputTanggalLahir');
    const inputNoHp = document.getElementById('inputNoHp');
    const inputInstagram = document.getElementById('inputInstagram');
    const inputTiktok = document.getElementById('inputTiktok');
    const inputAlamat = document.getElementById('inputAlamat');
    const inputQuotes = document.getElementById('inputQuotes');
    const formModeBadge = document.getElementById('formModeBadge');

    function cleanDisplayTTL(text) {
      if (!text) return '';
      let cleaned = text.trim();
      cleaned = cleaned.replace(/,?\s*\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|[A-Za-z]+)\s+\d{2,4}/gi, '');
      cleaned = cleaned.replace(/,?\s*\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, '');
      cleaned = cleaned.replace(/,?\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}/g, '');
      cleaned = cleaned.replace(/,\s*$/, '').trim();
      return cleaned || text.trim();
    }

    if (saved && (saved.nama || saved.ttl || saved.noHp || saved.tinggalDi)) {
      if (formModeBadge) {
        formModeBadge.style.display = 'inline-flex';
        formModeBadge.style.background = '#e0e7ff';
        formModeBadge.style.color = '#3730a3';
        formModeBadge.textContent = saved.timNama ? `✨ Data Aktif • ${saved.timNama}` : '✨ Data Aktif Terdaftar';
      }

      if (inputNama) inputNama.value = saved.nama || defaultNama;
      if (inputTempatLahir) inputTempatLahir.value = cleanDisplayTTL(saved.tempatLahir || '');
      if (inputTanggalLahir) inputTanggalLahir.value = saved.tanggalLahir || '';
      if (inputNoHp) inputNoHp.value = saved.noHp || '';
      if (inputInstagram) inputInstagram.value = (saved.ig || '').replace(/^@+/, '');
      if (inputTiktok) inputTiktok.value = (saved.tiktok || '').replace(/^@+/, '');
      if (inputAlamat) inputAlamat.value = saved.tinggalDi || '';
      if (inputQuotes) inputQuotes.value = saved.quotes || '';
    } else {
      if (formModeBadge) {
        formModeBadge.style.display = 'inline-flex';
        formModeBadge.style.background = '#ecfdf5';
        formModeBadge.style.color = '#047857';
        formModeBadge.textContent = '✨ Data Belum Ada • Silakan Lengkapi';
      }

      if (inputNama) inputNama.value = defaultNama;
      if (inputTempatLahir) inputTempatLahir.value = '';
      if (inputTanggalLahir) inputTanggalLahir.value = '';
      if (inputNoHp) inputNoHp.value = '';
      if (inputInstagram) inputInstagram.value = '';
      if (inputTiktok) inputTiktok.value = '';
      if (inputAlamat) inputAlamat.value = '';
      if (inputQuotes) inputQuotes.value = '';
    }

    // Trigger update live preview buku tahunan
    try {
      const evt = new Event('input', { bubbles: true });
      if (inputNama) inputNama.dispatchEvent(evt);
      if (inputQuotes) inputQuotes.dispatchEvent(evt);
      if (typeof window.updatePreviewLive === 'function') {
        window.updatePreviewLive();
      }
    } catch (e) {}

    // Tampilkan kartu tim kelompok jika sudah ada
    const teamCard = document.getElementById('studentTeamCard');
    const teamTitle = document.getElementById('teamCardTitle');
    if (saved && saved.timNama && teamCard) {
      teamCard.style.display = 'block';
      if (teamTitle) teamTitle.textContent = `Tim Kelompok Kamu: ${saved.timNama}`;
      if (typeof window.renderStudentTeamCard === 'function') {
        window.renderStudentTeamCard(kelas, absen);
      }
    }

    if (btnSubmit) {
      btnSubmit.innerHTML = `
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/></svg>
        Simpan & Perbarui Biodata
      `;
    }
  }

  function openSelfAppealModal(student, user) {
    pendingAbsen = student.absen;
    pendingStudent = student;
    document.getElementById('appealNamaSiswa').textContent = `${student.nama} (${kelas} Absen ${student.absen})`;
    document.getElementById('appealCurrentEmail').textContent = `${user.email} (Akun Anda Sendiri)`;
    const reasonEl = document.getElementById('appealAlasan');
    if (reasonEl) reasonEl.placeholder = 'Contoh: Saya salah klik nomor absen / nama teman saat memilih profil pertama kali...';
    modalAppeal.style.display = 'flex';
  }

  // FUNGSI UNTUK MENGUNCI IDENTITAS SISWA TERPILIH ("hanya saja tidak bisa di ubah")
  function lockStudentIdentity(student, user) {
    if (selectAbsenNama) {
      selectAbsenNama.value = student.absen;
      selectAbsenNama.disabled = true;
      selectAbsenNama.style.backgroundColor = '#f1f5f9';
      selectAbsenNama.style.borderColor = '#93c5fd';
      selectAbsenNama.style.cursor = 'not-allowed';
      selectAbsenNama.title = 'Nomor absen dan nama resmi terkunci permanen untuk akun Google Anda.';
    }

    if (lockBadge) {
      lockBadge.style.display = 'flex';
      lockBadge.style.justifyContent = 'space-between';
      lockBadge.style.alignItems = 'center';
      lockBadge.style.flexWrap = 'wrap';
      lockBadge.style.gap = '10px';
      lockBadge.style.background = 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
      lockBadge.style.borderColor = '#fdba74';
      lockBadge.style.padding = '12px 16px';
      lockBadge.style.borderRadius = '12px';
      lockBadge.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px;">
          <span style="font-size: 1.1rem;">🔒</span>
          <div>
            <div style="font-size: 0.88rem; font-weight: 800; color: #9a3412;">
              Profil Terkunci: ${student.nama} (${kelas} Absen ${student.absen})
            </div>
            <div style="font-size: 0.76rem; color: #c2410c;">
              Tertaut ke akun Google: <em>${user.email}</em> (Identitas siswa tidak dapat diubah)
            </div>
          </div>
        </div>
        <button type="button" id="btnSelfAppealInForm" style="background: #dc2626; color: white; border: none; border-radius: 8px; padding: 6px 14px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(220,38,38,0.25);">
          <span>⚖️</span> Salah Nama? Aju Lepas
        </button>
      `;

      const btnSelf = document.getElementById('btnSelfAppealInForm');
      if (btnSelf) {
        btnSelf.onclick = () => openSelfAppealModal(student, user);
      }
    }

    const linkKaos = document.getElementById('linkAuthKaosTtd');
    if (linkKaos) {
      const normK = String(kelas).toUpperCase();
      const normA = parseInt(student.absen, 10);
      linkKaos.href = `kaos-ttd.html?kelas=${normK}&absen=${normA}`;
      
      let kData = null;
      try {
        const kSnap = await get(ref(window.__nevastra_db, `kaos_ttd/${normK}/${normA}`));
        if (kSnap.exists() && kSnap.val() && (kSnap.val().ukuranKaos || kSnap.val().tipeLengan || kSnap.val().ttdBase64)) {
          kData = kSnap.val();
        }
      } catch (errK) {}

      if (!kData) {
        try {
          const loc = localStorage.getItem(`nevastra_kaos_${normK}_${normA}`);
          if (loc) {
            const p = JSON.parse(loc);
            if (p && (p.ukuranKaos || p.tipeLengan || p.ttdBase64)) kData = p;
          }
        } catch(e){}
      }

      if (kData) {
        linkKaos.innerHTML = `<span>✏️ Edit Kaos & TTD</span> <span style="background: rgba(4,120,87,0.12); padding: 2px 6px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">✓ ${kData.ukuranKaos || 'Terisi'}</span>`;
        linkKaos.style.background = '#ecfdf5';
        linkKaos.style.borderColor = '#10b981';
        linkKaos.style.color = '#047857';
      } else {
        linkKaos.innerHTML = `<span>👕✍️ Isi Kaos & TTD</span>`;
        linkKaos.style.background = '#eef2ff';
        linkKaos.style.borderColor = '#c7d2fe';
        linkKaos.style.color = '#4338ca';
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

  // Auth State Listener (Dipicu seketika Firebase selesai mengautentikasi)
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      userOwnBinding = null;
      activeStudentBinding = null;
      if (selectAbsenNama) {
        selectAbsenNama.disabled = true;
        selectAbsenNama.value = "";
      }
      if (lockBadge) lockBadge.style.display = 'none';
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

    // User Berhasil Login!
    currentUser = user;
    modalRequireLogin.classList.remove('show');

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

    // CEK DATA BINDING USER KE DATABASE NEVASTRA
    userOwnBinding = await getUserBinding(user.uid);

    const urlParams = new URLSearchParams(window.location.search);
    const queryAbsen = urlParams.get('absen');

    // KASUS 1: USER SUDAH PERNAH TAUTKAN NAMA SISWA SEBELUMNYA
    if (userOwnBinding) {
      if (userOwnBinding.kelas === kelas) {
        const student = classRoster.find(s => s.absen == userOwnBinding.absen);
        if (student) {
          // 1. Kunci identitas siswa ("hanya saja tidak bisa di ubah")
          lockStudentIdentity(student, user);

          // 2. Buka semua form input agar siswa bisa mengisi / memperbarui biodata
          setFormLockedState(false);

          // 3. Tampilkan seluruh datanya yang sudah dipilih dari database
          await loadAndDisplayStudentData(userOwnBinding.absen);
        }
      } else {
        // User terdaftar di kelas yang berbeda!
        setFormLockedState(true, "🔒 Akun Terdaftar di Kelas Lain");
        if (selectAbsenNama) selectAbsenNama.disabled = true;
        if (lockBadge) {
          lockBadge.style.display = 'flex';
          lockBadge.style.background = '#fef2f2';
          lockBadge.style.borderColor = '#fca5a5';
          lockBadge.style.color = '#991b1b';
          lockBadge.innerHTML = `
            <span>⚠️</span>
            <span>Akun Anda (${user.email}) telah terdaftar di <strong>Kelas ${userOwnBinding.kelas}</strong> (Absen ${userOwnBinding.absen} - ${userOwnBinding.nama}). <a href="${userOwnBinding.kelas.toLowerCase()}.html?absen=${userOwnBinding.absen}" style="color: #2563eb; font-weight: 800; text-decoration: underline; margin-left: 6px;">Buka Formulir Kelas Anda →</a></span>
          `;
        }
      }
      return;
    }

    // KASUS 2: USER BELUM PERNAH TAUTKAN NAMA
    if (queryAbsen && classRoster.some(s => s.absen == queryAbsen)) {
      selectAbsenNama.value = queryAbsen;
      await handleSelectionBinding(queryAbsen);
    } else {
      // Izinkan memilih nama dari dropdown
      if (selectAbsenNama) selectAbsenNama.disabled = false;
      setFormLockedState(true, "Silakan Pilih Nomor Absen & Nama Anda");
    }
  });

  // Handle Absen Change with Binding Verification
  let pendingAbsen = null;
  let pendingStudent = null;

  async function handleSelectionBinding(absen) {
    if (!currentUser) return false;

    const student = classRoster.find(s => s.absen == absen);
    if (!student) return false;

    // Cek di Firebase apakah siswa ini sudah tertaut akun
    const existingBinding = await getStudentBinding(kelas, absen);
    activeStudentBinding = existingBinding;

    if (!existingBinding) {
      // KASUS BELUM TERTAUT -> MUNCULKAN POPUP KONFIRMASI GANDA
      pendingAbsen = absen;
      pendingStudent = student;

      document.getElementById('bindModalNamaSiswa').textContent = student.nama;
      document.getElementById('bindModalKelasAbsen').textContent = `Kelas ${kelas} • Nomor Absen ${absen}`;
      document.getElementById('bindModalEmailUser').textContent = `${currentUser.displayName || ''} (${currentUser.email})`;
      modalConfirm.style.display = 'flex';
      return 'pending_confirm';
    }

    if (existingBinding.uid === currentUser.uid) {
      // Akun ini adalah pemilik profil siswa ini
      lockStudentIdentity(student, currentUser);
      setFormLockedState(false);
      await loadAndDisplayStudentData(absen);
      if (typeof onStudentUnlocked === 'function') onStudentUnlocked(student, existingBinding);
      return true;
    } else {
      // Profil siswa ini sudah diklaim oleh akun lain!
      setFormLockedState(true, "🔒 Profil Telah Tertaut dengan Akun Lain");
      if (selectAbsenNama) selectAbsenNama.disabled = false;
      if (lockBadge) lockBadge.style.display = 'none';
      if (typeof onStudentLocked === 'function') onStudentLocked(student, existingBinding);

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

  // Hook Event Selection Manual Dropdown
  if (selectAbsenNama) {
    selectAbsenNama.addEventListener('change', async () => {
      const val = selectAbsenNama.value;
      if (!val) return;
      if (!currentUser) return;
      await handleSelectionBinding(val);
    });
  }

  // Modal Confirm Binding Buttons
  btnConfirmBinding.onclick = async () => {
    if (!pendingAbsen || !pendingStudent || !currentUser) return;
    btnConfirmBinding.disabled = true;
    btnConfirmBinding.textContent = "Menautkan...";

    try {
      await bindStudentToUser(kelas, pendingAbsen, pendingStudent.nama, currentUser);
      userOwnBinding = { kelas, absen: pendingAbsen, studentKey: `${kelas}_${pendingAbsen}`, nama: pendingStudent.nama };
      modalConfirm.style.display = 'none';
      btnConfirmBinding.disabled = false;
      btnConfirmBinding.textContent = "Ya, Tautkan Akun Saya";

      // 1. Kunci identitas siswa ("hanya saja tidak bisa di ubah")
      lockStudentIdentity(pendingStudent, currentUser);

      // 2. Buka form inputs
      setFormLockedState(false);

      // 3. Tampilkan datanya dari database
      await loadAndDisplayStudentData(pendingAbsen);

      alert(`✅ Berhasil! Akun ${currentUser.email} telah resmi ditautkan ke profil ${pendingStudent.nama} (${kelas} Absen ${pendingAbsen}).`);
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

    const isSelfMistake = (userOwnBinding && userOwnBinding.absen == pendingAbsen);

    try {
      await submitStudentAppeal({
        kelas: kelas,
        absen: pendingAbsen,
        studentName: pendingStudent ? pendingStudent.nama : `Absen ${pendingAbsen}`,
        applicantUid: currentUser.uid,
        applicantEmail: currentUser.email,
        applicantName: currentUser.displayName || '',
        applicantWa: noWa,
        reason: alasan,
        type: isSelfMistake ? 'self_mistake' : 'claim_appeal'
      });

      alert(isSelfMistake 
        ? "✅ Permohonan lepas tautan akun telah dikirim ke Admin! Admin akan meninjau dan mereset akun Anda."
        : "✅ Pengajuan banding berhasil dikirim ke Admin. Admin akan meninjau dan membuka tautan jika valid."
      );
      modalAppeal.style.display = 'none';
      btnSubmitAppeal.disabled = false;
      btnSubmitAppeal.textContent = "Kirim Aju Banding";
    } catch (err) {
      console.error("Gagal kirim banding:", err);
      alert("Terjadi kesalahan saat mengirim formulir banding: " + err.message);
      btnSubmitAppeal.disabled = false;
      btnSubmitAppeal.textContent = "Kirim Aju Banding";
    }
  };

  const closeAppealModal = () => {
    modalAppeal.style.display = 'none';
  };
  btnCancelAppeal.onclick = closeAppealModal;
  btnCancelAppealCorner.onclick = closeAppealModal;
}
