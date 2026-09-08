# Web Pendataan Biodata Buku Tahunan (Yearbook) NEVASTRA 2026
**SMAN 1 Sumberrejo - Angkatan 2026**

Website pendataan ini memiliki **Tampilan Siswa Terpisah** dan **Panel Admin Terpadu**:

---

## 👨‍🎓 1. Tampilan Siswa per Kelas (`xii-1.html` s/d `xii-9.html`)

- **Halaman Langsung per Kelas**:
  - Kelas XII-1: `xii-1.html`
  - Kelas XII-2: `xii-2.html`
  - *(sampai dengan XII-9: `xii-9.html`)*
- **Nomor Absen & Nama Terkunci dari Roster Resmi**:
  - Siswa cukup memilih nomor absen dan namanya dari dropdown.
  - Nama dan nomor absen disinkronkan langsung dari daftar resmi siswa angkatan sehingga tidak akan tertukar.
- **Isian Biodata Lengkap**:
  - TTL (Tempat & Tanggal Lahir)
  - No. HP / WhatsApp
  - Akun Instagram (IG)
  - Tinggal di (Alamat domisili)
  - Kata-kata / Quotes Yearbook
- **Live Preview Kartu Buku Tahunan**:
  - Siswa dapat melihat langsung pratinjau kartu polaroid mereka saat mengetik data sebelum disimpan.

---

## 👨‍💼 2. Panel Admin & Rekapitulasi per Kelas (`admin.html`)

- **Klik Kelas Langsung Muncul Linknya**:
  - Tersedia tombol kelas **[XII-1] s/d [XII-9]**.
  - Saat admin mengklik salah satu kelas (misal **XII-1**):
    - **Kotak link kelas langsung muncul di atas**:
      - Alamat link lengkap (`.../xii-1.html`)
      - Tombol **Salin Link**
      - Tombol **Salin Pesan WA** (pesan broadcast siap kirim)
      - Tombol **Buka di WhatsApp**
      - Tombol **Buka Halaman Siswa**
    - **Rekap data kelas langsung tampil di bawahnya**:
      - Tabel 36 siswa urut Absen 1 sampai 36
      - Status pengisian: `✓ Sudah Mengisi` atau `⏳ Belum Mengisi`
      - Tombol **Download Excel Kelas Ini (.xlsx)**
      - Tombol **Salin Daftar Siswa yang Belum Mengisi** (untuk di-forward ke grup WA)
      - Tombol **Download Excel Semua Kelas (.xlsx)**
      - Tombol **Lihat Kartu Siswa (👁️)**

---

## 🚀 Cara Menjalankan

1. Masuk ke folder `C:\Users\ACER\OneDrive\ANGKATAN\web pendataan`.
2. Klik dua kali file **`Buka Web.bat`**.
3. Browser akan membuka **Panel Admin** (`http://localhost:8080/admin.html`).
