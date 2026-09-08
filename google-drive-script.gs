/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Upload Foto Buku Tahunan Nevastra 2026 ke Google Drive
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN (Hanya 1 Menit):
 * 1. Buka https://script.google.com dengan akun Google Drive Anda.
 * 2. Klik "New project" (Proyek baru).
 * 3. Hapus kode bawaan, lalu tempel (paste) seluruh kode di bawah ini.
 * 4. (Opsional) Masukkan ID Folder Google Drive Anda pada FOLDER_ID di bawah.
 *    - Jika dibiarkan kosong (""), foto akan otomatis tersimpan di folder utama (Root Drive).
 * 5. Klik tombol biru "Deploy" di kanan atas -> "New deployment"
 *    - Select type: Pilih "Web app" (ikon bola dunia)
 *    - Description: Upload Foto Nevastra 2026
 *    - Execute as: "Me" (email Anda)
 *    - Who has access: "Anyone" (Siapa saja, agar siswa bisa upload foto)
 * 6. Klik "Deploy", izinkan akses akun (Review permissions -> Advanced -> Go to ... (unsafe) -> Allow).
 * 7. Salin "Web app URL" (URL yang berakhiran /exec).
 * 8. Buka Dashboard Admin web Anda (admin.html), klik "Pengaturan Google Drive", lalu tempel URL tersebut!
 * =========================================================================
 */

// Ganti dengan ID Folder Google Drive Anda jika ingin disimpan di folder tertentu.
// Contoh: var FOLDER_ID = "1aBcD_XyZ1234567890...";
var FOLDER_ID = ""; 

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    
    // Tentukan folder target
    var folder;
    if (FOLDER_ID && FOLDER_ID.trim() !== "") {
      folder = DriveApp.getFolderById(FOLDER_ID.trim());
    } else {
      folder = DriveApp.getRootFolder();
    }

    // Format nama file: PERSIS SESUAI NAMA SISWA
    // Sesuai permintaan: "format namanya sama dengan nama orang nya"
    var ext = "jpg";
    if (data.fileName && data.fileName.indexOf(".") !== -1) {
      ext = data.fileName.split(".").pop().toLowerCase();
    }
    
    // Nama file bersih dari karakter terlarang
    var cleanName = (data.nama || "Siswa").replace(/[/\\?%*:|"<>]/g, "").trim();
    var finalFileName = cleanName + "." + ext;

    var contentType = data.mimeType || "image/jpeg";
    var base64Data = data.base64.replace(/^data:image\/[a-z]+;base64,/, "");
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, contentType, finalFileName);

    // Buat file di Google Drive
    var file = folder.createFile(blob);
    file.setDescription("Foto Buku Tahunan Siswa: " + cleanName + " (" + (data.kelas || "") + " Absen " + (data.absen || "") + ")");
    
    // Atur izin baca publik agar foto dapat ditampilkan di Dashboard Admin
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (errSharing) {}

    var fileId = file.getId();
    var fileUrl = file.getUrl();
    var directViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: fileId,
      fileUrl: fileUrl,
      directViewUrl: directViewUrl,
      fileName: finalFileName,
      nama: cleanName,
      kelas: data.kelas || "",
      absen: data.absen || ""
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Layanan Upload Google Drive Nevastra 2026 Aktif!"
  })).setMimeType(ContentService.MimeType.JSON);
}
