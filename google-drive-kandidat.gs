/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Upload Foto Kandidat Nominasi Ter- ke Google Drive
 * NEVASTRA 2026 - SMAN 1 Sumberrejo
 * =========================================================================
 * STRUKTUR FOLDER OTOMATIS:
 *   📁 nominasi-ter/
 *      └── [nama_kandidat].jpg
 * =========================================================================
 * DEPLOY: Extensions > Apps Script > Deploy > New Deployment > Web App
 *         Execute as: Me | Who has access: Anyone
 * Setelah deploy, salin URL-nya ke variabel KANDIDAT_SCRIPT_URL di daftar-kandidat.html
 * =========================================================================
 */

var NOMINASI_FOLDER_NAME = "nominasi-ter";
var PARENT_FOLDER_ID = ""; // Kosongkan = root Drive, atau isi ID folder utama Drive

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Tidak ada data." });
    }

    var data = JSON.parse(e.postData.contents);

    // Tentukan folder utama
    var parentFolder;
    if (PARENT_FOLDER_ID) {
      try { parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID); }
      catch(e) { parentFolder = DriveApp.getRootFolder(); }
    } else {
      parentFolder = DriveApp.getRootFolder();
    }

    // Buat / ambil folder nominasi-ter
    var nominasiFolder;
    var folderIter = parentFolder.getFoldersByName(NOMINASI_FOLDER_NAME);
    if (folderIter.hasNext()) {
      nominasiFolder = folderIter.next();
    } else {
      nominasiFolder = parentFolder.createFolder(NOMINASI_FOLDER_NAME);
    }

    // Validasi data
    var nama = (data.nama || "kandidat").replace(/[\/\\?%*:|"<>]/g, "").trim();
    var kelas = (data.kelas || "").trim();
    var absen = (data.absen || "").toString().trim();
    var kategori = (data.kategori || "umum").trim();
    var base64Raw = (data.base64 || "");
    var base64Data = base64Raw.replace(/^data:image\/[a-z]+;base64,/, "");

    if (!base64Data) {
      return jsonResponse({ status: "error", message: "Data foto kosong." });
    }

    // Nama file: NamaKandidatKelasAbsen.jpg
    var fileName = nama + "_" + kelas + "_" + absen + ".jpg";
    var mimeType = data.mimeType || "image/jpeg";
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);

    // Hapus foto lama jika ada (re-upload)
    try {
      var existFiles = nominasiFolder.getFilesByName(fileName);
      while (existFiles.hasNext()) { existFiles.next().setTrashed(true); }
    } catch(err) {}

    // Simpan file baru
    var file = nominasiFolder.createFile(blob);
    file.setDescription("Foto Kandidat Ter- | " + nama + " | " + kelas + " Absen " + absen + " | Kategori: " + kategori);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(err) {}

    var fileId = file.getId();
    var directViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return jsonResponse({
      status: "success",
      fileId: fileId,
      directViewUrl: directViewUrl,
      fileName: fileName,
      nama: nama,
      kelas: kelas,
      absen: absen,
      kategori: kategori
    });

  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ status: "active", message: "Upload Foto Kandidat Nominasi Ter- Nevastra 2026 Aktif!" });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
