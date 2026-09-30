# RANCANGAN SISTEM AUTHENTICATION SSO, LINKING PROFIL & PANEL BANDING NEVASTRA x BAJZA

Dokumen ini memuat spesifikasi arsitektur teknis pengintegrasian Firebase Authentication (Google/Email SSO Bajza Ecosystem) ke dalam Web Pendataan Angkatan NEVASTRA 2026 (`nevastra.bajza.my.id`), mekanisme penautan identitas siswa, alur konfirmasi & sanggah (aju banding), serta dashboard manajemen admin.

---

## 1. Arsitektur Terpusat SSO Bajza (Centralized Firebase Auth)

### 1.0 Prinsip Additive-Only (Tanpa Mengubah Layout/Tempat Eksisting)
- **Zero Layout Breaking:** Tidak ada pemindahan tata letak, reposisi elemen form, ataupun perubahan struktur UI yang sudah berjalan di web pendataan.
- **Purely Additive:** Seluruh fitur otentikasi berupa penambahan overlay/modal konfirmasi, auth barrier popup, serta halaman dan tab baru independen tanpa mengutak-atik alur maupun posisi komponen visual yang sudah ada.

### 1.1 Konsep Shared Authentication
- **Domain Root:** `bajza.my.id` & subdomain `nevastra.bajza.my.id`.
- **Firebase Auth Instance:** Menggunakan Firebase Project Bajza (`bajza-auth` / project terpusat) sehingga sesi login Google/Email berlaku secara Single Sign-On (SSO). Saat pengguna login di Web Pendataan, sesi akun yang sama otomatis dikenali di platform utama Bajza Web (dan sebaliknya).
- **Dual Database Handling:** 
  - `auth` dihandle oleh Firebase Auth Bajza.
  - `database` (RTDB) tetap menyasar database `nevastra-default-rtdb` untuk menyimpan data biodata siswa, pemetaan tautan akun, dan tiket aju banding.

---

## 2. Alur Pengguna (User Flow)

```
[Buka Halaman Form Kelas]
           │
           ▼
[Cek Auth State] ──(Belum Login)──► [Wajib Login Google / Akun Bajza]
           │                                      │
       (Sudah Login) ◄────────────────────────────┘
           │
           ▼
[Pilih Nama Siswa dari Dropdown]
           │
   ┌───────┴───────────────────────────────┐
   ▼                                       ▼
[Siswa Belum Tertaut Akun]            [Siswa Sudah Tertaut Akun]
   │                                       │
   ▼                                  ┌────┴──────────────────────────┐
[Modal Konfirmasi Identitas]          ▼                               ▼
"Apakah Anda yakin ini data Anda?"  (Akun Cocok dgn UID)       (Akun Orang Lain)
   │                                  │                               │
   ├─► [Batal] -> Pilih ulang         ▼                               ▼
   └─► [Konfirmasi Tautkan]     [Buka Form Biodata]         [Terkunci + Tombol
           │                         (Dapat Mengedit)         Aju Banding]
           ▼                                                          │
[Kunci UID & Email ke RTDB]                                           ▼
           │                                                [Modal Form Aju Banding]
           ▼                                                Isi alasan & kontak WA
[Buka Form Pengisian Biodata]                                         │
                                                                      ▼
                                                            [Simpan ke Antrean Admin]
```

### 2.1 Tahapan Detail:
1. **Gerbang Wajib Login (Auth Gate):** Pengguna yang mengakses halaman kelas (`xii-1.html` s.d. `xii-9.html`) diwajibkan login via Google Popup terlebih dahulu sebelum form dapat dibuka.
2. **Seleksi Siswa & Pemeriksaan Tautan:**
   - Jika siswa yang dipilih **belum tertaut**: Muncul modal konfirmasi: *"Konfirmasi Penautan Akun: Apakah kamu benar [Nama Siswa] Kelas [XII-X] Absen [Y]? Akun Google [email@gmail.com] akan dikunci permanen untuk profil ini."*
   - Jika siswa **sudah tertaut ke akun aktif (UID sama)**: Form langsung terbuka dengan seluruh data tersinkronisasi.
   - Jika siswa **sudah tertaut ke akun orang lain (UID beda)**: Akses input dikunci dengan notifikasi *"Profil ini telah tertaut dengan akun lain. Jika ini adalah data kamu yang keliru diambil, silakan ajukan banding."*
3. **Form Aju Banding (Appeal Mechanism):** Siswa yang akunnya keliru atau diambil orang lain dapat mengisi formulir aju banding langsung dari popup (menyertakan alasan dan nomor WhatsApp aktif).

---

## 3. Struktur Skema Database Firebase RTDB

```json
{
  "auth_bindings": {
    "XII-1_05": {
      "kelas": "XII-1",
      "absen": 5,
      "nama": "Ahmad Dani",
      "uid": "google_uid_abc123",
      "email": "ahmaddani@gmail.com",
      "displayName": "Ahmad Dani",
      "photoURL": "https://lh3.googleusercontent.com/...",
      "linkedAt": "2026-09-30T10:00:00.000Z"
    }
  },
  "user_to_student": {
    "google_uid_abc123": {
      "studentKey": "XII-1_05",
      "email": "ahmaddani@gmail.com"
    }
  },
  "appeals": {
    "appeal_id_789": {
      "studentKey": "XII-1_05",
      "kelas": "XII-1",
      "absen": 5,
      "namaSiswa": "Ahmad Dani",
      "claimedByUid": "google_uid_xyz999",
      "claimedByEmail": "dani.asli@gmail.com",
      "claimedByName": "Dani Asli",
      "currentLinkedEmail": "ahmaddani@gmail.com",
      "alasan": "Akun saya sebelumnya keliru dipilih teman sekelas.",
      "noWa": "08123456789",
      "status": "pending",
      "createdAt": "2026-09-30T10:15:00.000Z"
    }
  },
  "biodata": {
    "XII-1": {
      "5": {
        "namaLengkap": "Ahmad Dani",
        "quotes": "Tetap menyala.",
        "noHp": "08123456789",
        "lastEditedByUid": "google_uid_abc123"
      }
    }
  }
}
```

---

## 4. Fitur Panel Admin & Halaman Khusus Status Tautan

### 4.1 Halaman Baru: `status-akun.html` (Monitoring Akun Tertaut)
- Khusus menampilkan tabel ringkas 324 siswa angkatan XII-1 s.d. XII-9.
- **Kolom Tabel:** Kelas, Absen, Nama Siswa, Status Tautan (`TERTAUT` [Hijau] / `BELUM TERTAUT` [Abu-abu]), Email Google, Waktu Taut, Aksi (`Unlink Akun`).
- **Fitur Filter & Search:** Filter per kelas (XII-1 s.d. XII-9), toggle tampilkan hanya yang belum tertaut, dan pencarian instan nama/email.
- **Ekspor Ringkas:** Tombol ekspor daftar akun ke format CSV/Excel untuk mempermudah pengecekan wali kelas/ketua kelas.

### 4.2 Tab / Panel Khusus Aju Banding di `admin.html`
- Badge notifikasi jumlah aju banding pending (contoh: `Aju Banding (3)`).
- Card list yang menampilkan detail pembanding vs akun yang saat ini menduduki profil:
  - Profil yang diperebutkan: Nama, Kelas, Absen.
  - Akun Saat Ini: Email & Waktu taut.
  - Akun Pemohon: Nama Akun Google, Email, Nomor WhatsApp (ada tombol langsung chat WA `wa.me/...`), dan Alasan.
- **Aksi Admin:**
  - Tombol **[Setujui & Pindahkan Tautan]**: Otomatis melepaskan akun lama dan mengunci profil ke akun pemohon baru.
  - Tombol **[Tolak Banding]**: Menolak pengajuan dengan catatan alasan penolakan.

---

## 5. Aturan Keamanan Firebase (Security Rules)

```json
{
  "rules": {
    "auth_bindings": {
      ".read": "auth != null",
      "$studentKey": {
        ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid || root.child('admins').hasChild(auth.uid))"
      }
    },
    "user_to_student": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && ($uid === auth.uid || root.child('admins').hasChild(auth.uid))"
      }
    },
    "appeals": {
      ".read": "auth != null && root.child('admins').hasChild(auth.uid)",
      "$appealId": {
        ".write": "auth != null && (!data.exists() || root.child('admins').hasChild(auth.uid))"
      }
    },
    "biodata": {
      ".read": true,
      "$kelas": {
        "$absen": {
          ".write": "auth != null && (root.child('auth_bindings/' + $kelas + '_' + $absen + '/uid').val() === auth.uid || root.child('admins').hasChild(auth.uid))"
        }
      }
    }
  }
}
```

---

## 6. Rencana Implementasi Bertahap

1. **Tahap 1:** Pembuatan modul `auth-service.js` berbasis Firebase Auth ekosistem Bajza untuk login popup Google dan sinkronisasi sesi.
2. **Tahap 2:** Integrasi modal konfirmasi pemilihan nama & auto-binding ke RTDB pada form kelas (`xii-1.html` s.d. `xii-9.html`).
3. **Tahap 3:** Pembuatan form pop-up aju banding untuk siswa yang akunnya terblokir / keliru diklaim.
4. **Tahap 4:** Pembuatan halaman baru `status-akun.html` untuk memonitor 324 siswa (tertaut vs belum tertaut).
5. **Tahap 5:** Penambahan tab approval antrean aju banding dan fungsi unlink darurat di `admin.html`.
