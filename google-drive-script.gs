/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Upload Foto Buku Tahunan Nevastra 2026 ke Google Drive
 * SISTEM AUTO-FOLDER PER KELAS (XII-1 s/d XII-9)
 * =========================================================================
 * 
 * STRUKTUR PENYIMPANAN OTOMATIS:
 * 📁 Folder Utama Google Drive
 *    ├── 📁 XII-1  --> [Nama Siswa].jpg
 *    ├── 📁 XII-2  --> [Nama Siswa].jpg
 *    ├── 📁 XII-3  --> [Nama Siswa].jpg
 *    ├── 📁 XII-4  --> [Nama Siswa].jpg
 *    ├── 📁 XII-5  --> [Nama Siswa].jpg
 *    ├── 📁 XII-6  --> [Nama Siswa].jpg
 *    ├── 📁 XII-7  --> [Nama Siswa].jpg
 *    ├── 📁 XII-8  --> [Nama Siswa].jpg
 *    └── 📁 XII-9  --> [Nama Siswa].jpg
 * =========================================================================
 */

// Ganti dengan ID Folder Google Drive Utama Anda jika ingin disimpan di folder khusus.
// Contoh: var FOLDER_ID = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456";
// Jika dikosongkan (""), otomatis disimpan di folder utama (Root Drive).
var FOLDER_ID = ""; 

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data yang diterima dari formulir."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    
    // 1. Tentukan folder utama (Parent Folder) - 100% Kebal ReferenceError
    var parentFolder;
    var targetFolderId = "";
    try {
      if (typeof FOLDER_ID !== 'undefined' && FOLDER_ID) {
        targetFolderId = FOLDER_ID.toString().trim();
      }
    } catch (errId) {
      targetFolderId = "";
    }

    if (targetFolderId !== "") {
      try {
        parentFolder = DriveApp.getFolderById(targetFolderId);
      } catch (errGetFolder) {
        parentFolder = DriveApp.getRootFolder();
      }
    } else {
      parentFolder = DriveApp.getRootFolder();
    }

    // 2. Tentukan atau buat subfolder otomatis sesuai KELAS siswa (XII-1 s/d XII-9)
    var className = (data.kelas || "Lainnya").trim();
    var folderIter = parentFolder.getFoldersByName(className);
    var classFolder;
    if (folderIter.hasNext()) {
      classFolder = folderIter.next();
    } else {
      // Buat folder kelas baru secara otomatis jika belum ada di Drive
      classFolder = parentFolder.createFolder(className);
    }

    // 3. Format nama file: PERSIS SESUAI NAMA SISWA
    var ext = "jpg";
    if (data.fileName && data.fileName.indexOf(".") !== -1) {
      ext = data.fileName.split(".").pop().toLowerCase();
    }
    
    // Bersihkan karakter yang dilarang pada penamaan berkas
    var cleanName = (data.nama || "Siswa").replace(/[/\\?%*:|"<>]/g, "").trim();
    var finalFileName = cleanName + "." + ext;

    var contentType = data.mimeType || "image/jpeg";
    var rawBase64 = (data.base64 || "");
    var base64Data = rawBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    
    if (!base64Data) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Data foto kosong atau tidak valid."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, contentType, finalFileName);

    // 4. Hapus foto lama jika siswa mengunggah ulang dengan nama file yang sama di kelas tersebut
    try {
      var existingFiles = classFolder.getFilesByName(finalFileName);
      while (existingFiles.hasNext()) {
        var oldFile = existingFiles.next();
        oldFile.setTrashed(true);
      }
    } catch (errCleanOld) {}

    // 5. Buat file foto baru di dalam subfolder KELAS masing-masing
    var file = classFolder.createFile(blob);
    file.setDescription("Foto Profil Buku Tahunan: " + cleanName + " (" + className + " Absen " + (data.absen || "") + ")");
    
    // Atur izin baca publik agar thumbnail bisa langsung tampil di web admin
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
      folderName: className,
      nama: cleanName,
      kelas: className,
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
    message: "Layanan Upload Google Drive Nevastra 2026 Aktif (Subfolder XII-1 s/d XII-9)!"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * OPSIONAL: Jalankan fungsi ini sekali di editor Google Apps Script
 * jika Anda ingin langsung membuatkan semua 9 folder kelas (XII-1 s/d XII-9) di Google Drive sekaligus!
 */
function setupAllClassFolders() {
  var parentFolder;
  var targetFolderId = "";
  try {
    if (typeof FOLDER_ID !== 'undefined' && FOLDER_ID) {
      targetFolderId = FOLDER_ID.toString().trim();
    }
  } catch(errId) {
    targetFolderId = "";
  }

  if (targetFolderId !== "") {
    try {
      parentFolder = DriveApp.getFolderById(targetFolderId);
    } catch(errGet) {
      parentFolder = DriveApp.getRootFolder();
    }
  } else {
    parentFolder = DriveApp.getRootFolder();
  }

  var classes = ["XII-1", "XII-2", "XII-3", "XII-4", "XII-5", "XII-6", "XII-7", "XII-8", "XII-9"];
  var created = [];

  for (var i = 0; i < classes.length; i++) {
    var c = classes[i];
    if (!parentFolder.getFoldersByName(c).hasNext()) {
      parentFolder.createFolder(c);
      created.push(c);
    }
  }
  Logger.log("Selesai! Folder yang dibuat: " + (created.length > 0 ? created.join(", ") : "Semua folder XII-1 s/d XII-9 sudah ada!"));
}
