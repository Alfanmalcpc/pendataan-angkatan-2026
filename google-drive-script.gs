/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Upload Foto Buku Tahunan Nevastra 2026 ke Google Drive
 * SISTEM AUTO-FOLDER PER KELAS (XII-1 s/d XII-9)
 * =========================================================================
 * 
 * STRUKTUR PENYIMPANAN OTOMATIS:
 * 📁 Folder Utama Google Drive
 *    ├── 📁 XII-1  --> [Nama Siswa XII-1].jpg
 *    ├── 📁 XII-2  --> [Nama Siswa XII-2].jpg
 *    ├── 📁 XII-3  --> [Nama Siswa XII-3].jpg
 *    ├── 📁 XII-4  --> [Nama Siswa XII-4].jpg
 *    ├── 📁 XII-5  --> [Nama Siswa XII-5].jpg
 *    ├── 📁 XII-6  --> [Nama Siswa XII-6].jpg
 *    ├── 📁 XII-7  --> [Nama Siswa XII-7].jpg
 *    ├── 📁 XII-8  --> [Nama Siswa XII-8].jpg
 *    └── 📁 XII-9  --> [Nama Siswa XII-9].jpg
 * 
 * FITUR:
 * 1. Otomatis membuat subfolder kelas jika belum ada di dalam Google Drive.
 * 2. Menyimpan foto langsung ke dalam subfolder kelas siswa masing-masing.
 * 3. Format nama berkas otomatis persis sesuai nama siswa (contoh: Mochamad Alfan.jpg).
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
        message: "Tidak ada data yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    
    // 1. Tentukan folder utama (Parent Folder)
    var parentFolder;
    var targetFolderId = (typeof FOLDER_ID !== 'undefined') ? FOLDER_ID : "";
    if (targetFolderId && targetFolderId.trim() !== "") {
      parentFolder = DriveApp.getFolderById(targetFolderId.trim());
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
      // Buat folder kelas baru secara otomatis jika belum ada
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
    var base64Data = data.base64.replace(/^data:image\/[a-z]+;base64,/, "");
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, contentType, finalFileName);

    // 4. Buat file foto di dalam subfolder KELAS masing-masing
    var file = classFolder.createFile(blob);
    file.setDescription("Foto Buku Tahunan Siswa: " + cleanName + " (" + className + " Absen " + (data.absen || "") + ")");
    
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
  var targetFolderId = (typeof FOLDER_ID !== 'undefined') ? FOLDER_ID : "";
  if (targetFolderId && targetFolderId.trim() !== "") {
    parentFolder = DriveApp.getFolderById(targetFolderId.trim());
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
