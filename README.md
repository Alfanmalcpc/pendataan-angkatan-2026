# Web Pendataan Biodata Buku Tahunan (Yearbook) NEVASTRA 2026
**SMAN 1 Sumberrejo - Angkatan 2026**

---

## 🌟 Fitur & Pembaruan Terbaru
1. **Upload Foto ke Google Drive (Subfolder Kelas XII-1 s/d XII-9 & Nama = Nama Siswa)**:
   - Siswa dapat mengunggah foto yearbook langsung di formulir kelas.
   - Foto otomatis disortir ke subfolder kelas masing-masing (`XII-1`, `XII-2`, ..., `XII-9`) di dalam Google Drive.
   - Format nama berkas otomatis persis sesuai nama siswa (contoh: `XII-1/Mochamad Alfan.jpg`).
   - Pratinjau Polaroid interaktif langsung menampilkan foto saat dipilih.
2. **Format Nama Huruf Depan Saja / Title Case**:
   - Seluruh 322 nama siswa resmi dari kelas XII-1 s/d XII-9 menggunakan format huruf kapital di awal kata.
3. **Penyusunan Nama & Absen Terkunci**:
   - Nomor absen dan nama langsung berpasangan resmi sesuai daftar siswa sekolah agar tidak tertukar.
4. **Dashboard Admin Terpadu (`admin.html`)**:
   - Tab kelas XII-1 s/d XII-9 + Tab Semua Kelas.
   - Kolom foto dengan thumbnail dan tautan langsung ke berkas Google Drive.
   - Fitur salin pesan broadcast WhatsApp per kelas.
   - Ekspor data lengkap ke Excel (`.xlsx`) beserta tautan foto Google Drive.
   - Kotak pengaturan Google Drive untuk integrasi Google Apps Script.

---

## 🌐 Tautan Web Online
- **Portal Siswa**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/](https://alfanmalcpc.github.io/pendataan-angkatan-2026/)
- **Dashboard Admin**: [https://alfanmalcpc.github.io/pendataan-angkatan-2026/admin.html](https://alfanmalcpc.github.io/pendataan-angkatan-2026/admin.html)

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

## 📁 Panduan Pemasangan Google Drive (Google Apps Script)
1. Buka [https://script.google.com](https://script.google.com) dengan akun Google Anda.
2. Klik **New project**.
3. Buka berkas `google-drive-script.gs` di folder ini, salin seluruh isinya dan tempel ke editor script.
4. (Opsional) Masukkan ID folder Google Drive pada variabel `FOLDER_ID`. Jika dibiarkan kosong, foto otomatis disimpan di root Google Drive.
5. Klik tombol **Deploy** > **New deployment** > pilih jenis **Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
6. Klik **Deploy**, izinkan akses akun (Review permissions > Advanced > Go to ... > Allow).
7. Salin **Web app URL** (berakhiran `/exec`), buka `admin.html`, tempel di kotak "Pengaturan Penyimpanan Foto Google Drive", lalu klik **Simpan Pengaturan**.
