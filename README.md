# Web Pendataan Biodata Buku Tahunan (Yearbook) NEVASTRA 2026
**SMAN 1 Sumberrejo - Angkatan 2026**

---

## 🌟 Fitur Utama & Pembaruan Sistem

### 1. Pembagian 6 Tim Kelompok per Kelas (Otomatis & Gender-Safe)
- **6 Tim per Kelas (@ 6 Siswa)**: Sesuai kapasitas kelas (~36 siswa), setiap siswa yang mengisi atau menyimpan biodata di kelasnya (`xii-1.html` s/d `xii-9.html`) otomatis dialokasikan ke salah satu dari **6 tim** (Tim 1 s/d Tim 6).
- **Aturan Ketat Gender Seimbang (Anti 1 Laki-laki / 1 Perempuan Sendirian)**:
  - DILARANG terjadi 1 laki-laki sendirian di antara perempuan (1L + 5P).
  - DILARANG terjadi 1 perempuan sendirian di antara laki-laki (5L + 1P).
  - Kelompok sesama jenis (6L 0P atau 0L 6P) DIPERBOLEHKAN.
  - Komposisi campuran yang seimbang (2L 4P, 3L 3P, 4L 2P) diprioritaskan oleh algoritma penyeimbang otomatis.
- **Tim Terkunci Permanen**: Sekali siswa ditetapkan masuk ke suatu tim, tim tersebut **TIDAK BISA DIUBAH** jika siswa mengedit data biodatanya di kemudian hari. Hanya Admin yang memiliki wewenang untuk mereset alokasi tim.
- **Transparansi Teman 1 Tim & Lokasi Tempat Tinggal**:
  - Siswa dapat langsung melihat siapa teman 1 kelompok mereka di formulir kelas (`studentTeamCard`).
  - Menampilkan lokasi tempat tinggal teman sekelompok (*"teman ada di mana"* / Alamat Domisili).
  - Dilengkapi tombol chat langsung ke WhatsApp masing-masing anggota.
- **Jenis Kelamin Khusus untuk Kelompok**: Kolom *Jenis Kelamin* ditanyakan pada formulir siswa hanya untuk alokasi kelompok yang aman, dan **tidak dicetak** pada rekap tabel buku tahunan resmi.

### 2. Akses Siswa vs Akses Admin untuk Data Kelompok
- **Halaman Siswa (`kelompok.html`)**:
  - Siswa dapat melihat daftar 6 tim per kelas secara langsung di web.
  - **DIBATASI**: Siswa **TIDAK BISA mendownload data** demi keamanan privasi.
  - Jalur rahasia/private: Tidak ada tautan menuju panel admin atau rekap dari halaman publik.
- **Panel Admin (`admin.html` > Tab *Data 6 Kelompok Tim*)**:
  - Admin dapat memantau komposisi seluruh tim per kelas maupun seluruh angkatan.
  - **Fitur Download Excel (`.xlsx`)**: Admin dapat mengunduh seluruh data kelompok beserta alamat domisili dan nomor WhatsApp ke format file Excel dengan satu klik.
  - **Fitur Sinkronisasi & Reset**: Admin dapat menyinkronkan siswa yang sudah mendaftar sebelumnya atau mereset pembagian kelompok jika diperlukan.

### 3. Sistem Voting Metode Pembagian Kelompok (`voting.html`)
- **Login Wajib Akun Google (Firebase Authentication)**.
- **1 Siswa = 1 Suara Sah**: Verifikasi UID akun Google serta data Siswa (Kelas + Absen).
- **Pilihan Voting**:
  - *Opsi 1*: Kelompok Urut Absen.
  - *Opsi 2*: Kelompok Diacak oleh Sistem.
- **Sinkronisasi Otomatis Google Sheets (`google-sheet-voting-script.gs`)** secara realtime.

---

## 🌐 Tautan Web & Halaman Resmi

- **Portal Siswa**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/](https://alfanmalcpc.github.io/pendataan-angkatan-2026/)
- **Halaman Kelompok Siswa (View-Only)**: `kelompok.html`
- **Halaman Voting Kelompok (Private)**: `voting.html`
- **Dashboard Admin (Private)**: `admin.html`
- **Rekap Biodata Angkatan (Private)**: `rekap.html`

### Formulir Pengisian per Kelas
- **Kelas XII-1**: `xii-1.html`
- **Kelas XII-2**: `xii-2.html`
- **Kelas XII-3**: `xii-3.html`
- **Kelas XII-4**: `xii-4.html`
- **Kelas XII-5**: `xii-5.html`
- **Kelas XII-6**: `xii-6.html`
- **Kelas XII-7**: `xii-7.html`
- **Kelas XII-8**: `xii-8.html`
- **Kelas XII-9**: `xii-9.html`

---

## ☁️ Panduan Menghubungkan Repository ke Cloudflare Pages

1. Masuk ke Dashboard **Cloudflare** di [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Pada menu navigasi sebelah kiri, pilih **Workers & Pages** > klik **Create application**.
3. Pilih tab **Pages** > klik **Connect to Git**.
4. Hubungkan akun GitHub Anda (`Alfanmalcpc`) dan pilih repository: **`pendataan-angkatan-2026`**.
5. Konfigurasi Deployment:
   - **Project name**: `pendataan-angkatan-2026` (atau sesuai keinginan)
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: *(Kosongkan)*
   - **Build output directory**: `.` *(titik / root folder)*
6. Klik **Save and Deploy**.
7. Cloudflare Pages akan otomatis membaca konfigurasi berkas `_headers`, `_redirects`, dan `wrangler.toml` yang sudah tersedia di repository.
8. Website Anda akan langsung aktif dengan domain berkecepatan tinggi global Cloudflare (contoh: `https://pendataan-angkatan-2026.pages.dev`). Setiap kali Anda push ke GitHub branch `main`, Cloudflare Pages akan otomatis memperbarui situs!

---

## 📊 Panduan Pasang Google Sheets Voting
1. Buat Spreadsheet Baru di Google Drive ([https://drive.google.com](https://drive.google.com)) dengan judul: `HASIL VOTING KELOMPOK NEVASTRA 2026`.
2. Klik menu **Ekstensi (Extensions)** > **Apps Script**.
3. Salin seluruh isi file `google-sheet-voting-script.gs` ke editor Apps Script.
4. Klik tombol **Deploy** > **New deployment** > pilih jenis **Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Klik **Deploy**, beri izin akun Google Anda, lalu salin **Web app URL**.
6. Buka `admin.html` > pilih Tab **Rekap Voting Kelompok Angkatan**, tempel URL tersebut, lalu klik **Simpan URL Sheet**. Selesai!
