# Web Pendataan Biodata Buku Tahunan (Yearbook) NEVASTRA 2026
**SMAN 1 Sumberrejo - Angkatan 2026**

---

## 🌟 Fitur & Pembaruan Terbaru
1. **Upload Foto ke Google Drive (Subfolder Kelas XII-1 s/d XII-9 & Nama = Nama Siswa)**:
   - Siswa dapat mengunggah foto yearbook langsung di formulir kelas.
   - Foto otomatis disortir ke subfolder kelas masing-masing (`XII-1`, `XII-2`, ..., `XII-9`) di dalam Google Drive.
   - Format nama berkas otomatis persis sesuai nama siswa (contoh: `XII-1/Mochamad Alfan.jpg`).
   - Pratinjau Polaroid interaktif langsung menampilkan foto saat dipilih.
2. **Sistem Voting Metode Pembagian Kelompok Yearbook (`voting.html`)**:
   - Setiap siswa diwajibkan **Login dengan Akun Google** (Firebase Authentication).
   - **Anti Voting Ganda (1 Siswa = 1 Suara Sah)**: Sistem memverifikasi UID akun Google serta data unik Siswa (Kelas + Absen) agar tidak bisa memilih lebih dari 1 kali.
   - Pilihan voting:
     - **Opsi 1**: Kelompok Urut Absen.
     - **Opsi 2**: Kelompok Diacak oleh Sistem.
   - Setiap suara yang masuk otomatis tersimpan permanen di Firebase Realtime Database dan diteruskan langsung ke Google Spreadsheet.
   - Siswa yang sudah voting otomatis menerima bukti tanda terima sah dan grafik perolehan suara sementara.
3. **Sinkronisasi Otomatis ke Google Sheets (`google-sheet-voting-script.gs`)**:
   - Script siap pakai yang dapat langsung dipasang di Google Sheets (Menu *Ekstensi* > *Apps Script*).
   - Menghasilkan baris data otomatis: `Waktu Voting`, `Nama Siswa`, `Kelas`, `No Absen`, `Pilihan Voting`, `Email Akun Google`, dan `UID Firebase`.
4. **Dashboard Rekapitulasi Voting di Panel Admin (`admin.html`)**:
   - Tab khusus *Rekap Voting Kelompok Angkatan*.
   - Metrik total suara masuk, persentase Opsi 1 vs Opsi 2, dan visual perbandingan dual-color realtime.
   - Kolom pengaturan URL Google Sheets Web App dengan tombol tes koneksi langsung.
   - Fitur ekspor seluruh hasil suara ke format resmi Excel (`.xlsx`).
   - Fitur hapus data voting tertentu jika siswa perlu melakukan pemilihan ulang.
5. **Upload Foto ke Google Drive (Subfolder Kelas XII-1 s/d XII-9 & Nama = Nama Siswa)**:
   - Foto otomatis disortir ke subfolder kelas masing-masing di dalam Google Drive.
   - Format nama berkas otomatis persis sesuai nama siswa (contoh: `XII-1/Mochamad Alfan.jpg`).
6. **Format Nama Huruf Depan Saja / Title Case & Absen Terkunci**:
   - Seluruh 322 nama siswa resmi dari kelas XII-1 s/d XII-9 disinkronkan langsung dari daftar sekolah.

---

## 🌐 Tautan Web Online
- **Portal Siswa**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/](https://alfanmalcpc.github.io/pendataan-angkatan-2026/)
- **Halaman Voting Kelompok**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/voting.html](https://alfanmalcpc.github.io/pendataan-angkatan-2026/voting.html)
- **Dashboard Admin**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/admin.html](https://alfanmalcpc.github.io/pendataan-angkatan-2026/admin.html)
- **Distribusi Link Kelas & Broadcast**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/links.html](https://alfanmalcpc.github.io/pendataan-angkatan-2026/links.html)

---

## 👨‍🎓 Tautan Formulir per Kelas
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

## 📊 Panduan 1 Menit Pasang Google Sheets Voting (Siap Pakai)
1. Buat Spreadsheet Baru di Google Drive ([https://drive.google.com](https://drive.google.com)) dengan judul: `HASIL VOTING KELOMPOK NEVASTRA 2026`.
2. Klik menu **Ekstensi (Extensions)** > **Apps Script**.
3. Buka berkas `google-sheet-voting-script.gs` di folder web ini, salin seluruh isinya dan tempel ke editor Apps Script.
4. Klik tombol biru **Deploy (Terapkan)** di pojok kanan atas > pilih **New deployment (Deployment baru)**.
5. Pada ikon gerigi (Select type), pilih **Web app**.
   - *Description*: Hasil Voting Nevastra 2026
   - *Execute as*: **Me** (Akun Google Anda)
   - *Who has access*: **Anyone** (Siapa saja)  *(Wajib agar voting dari siswa langsung masuk)*
6. Klik **Deploy**, klik **Review permissions**, pilih akun Google Anda, klik **Advanced (Lanjutan)** > **Go to ... (unsafe)** > **Allow (Izinkan)**.
7. Salin **Web app URL** (berakhiran `/exec`), buka `admin.html` > pilih Tab **Rekap Voting Kelompok Angkatan**, tempel di kolom "Penyimpanan Langsung ke Google Sheets", lalu klik **Simpan URL Sheet**.
8. Klik tombol **Tes Koneksi** untuk memastikan spreadsheet sudah terhubung. Selesai!

---

## 📁 Panduan Pemasangan Google Drive Foto (Google Apps Script)
1. Buka [https://script.google.com](https://script.google.com) dengan akun Google Anda.
2. Klik **New project**.
3. Buka berkas `google-drive-script.gs` di folder ini, salin seluruh isinya dan tempel ke editor script.
4. Klik tombol **Deploy** > **New deployment** > pilih jenis **Web app** (*Execute as: Me*, *Who has access: Anyone*).
5. Klik **Deploy**, izinkan akses akun, salin **Web app URL**, lalu simpan di pengaturan sistem.

