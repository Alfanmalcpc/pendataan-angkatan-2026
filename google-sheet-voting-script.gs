/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Sinkronisasi Otomatis Hasil Voting ke Google Sheets
 * NEVASTRA 2026 - SMAN 1 SUMBERREJO
 * =========================================================================
 * 
 * 📋 PANDUAN CEPAT PEMASANGAN (1 MENIT SIAP PAKAI):
 * 1. Buka Google Drive (https://drive.google.com) dan buat Spreadsheet Baru
 *    atau buka spreadsheet yang sudah Anda siapkan.
 * 2. Beri nama spreadsheet Anda, contoh: "HASIL VOTING KELOMPOK NEVASTRA 2026".
 * 3. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 4. Hapus semua kode yang ada di editor Apps Script, lalu SALIN & TEMPELKAN
 *    seluruh isi file ini ke dalamnya.
 * 5. (Opsional) Jika script dibuat terpisah dari sheet, isi SPREADSHEET_ID di bawah.
 *    Jika script dibuka lewat menu Ekstensi Spreadsheet langsung, biarkan SPREADSHEET_ID kosong ("").
 * 6. Klik tombol "Deploy" (Terapkan) berwarna biru di kanan atas > pilih "New deployment" (Deployment baru).
 * 7. Pada ikon gerigi (Select type), pilih "Web app" (Aplikasi web).
 *    - Description : Hasil Voting Nevastra 2026
 *    - Execute as  : Me (Akun Google Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING!
 * 8. Klik "Deploy". Jika muncul jendela izin:
 *    - Klik "Review Permissions" / "Izinkan Akses"
 *    - Pilih akun Google Anda
 *    - Klik "Advanced" (Lanjutan) di kiri bawah
 *    - Klik "Go to ... (unsafe)"
 *    - Klik "Allow" / "Izinkan"
 * 9. Salin "Web app URL" yang muncul (URL berakhiran /exec).
 * 10. Buka Panel Admin web kita (admin.html), tempel URL tersebut di bagian
 *     "Pengaturan Google Sheets Voting", lalu klik "Simpan Pengaturan".
 * 
 * SELESAI! Setiap kali siswa melakukan voting di web, baris data baru akan
 * otomatis masuk ke Google Sheet Anda secara realtime!
 * =========================================================================
 */

// Kosongkan jika script dibuka via menu Ekstensi Google Sheet langsung.
// Atau isi dengan ID Spreadsheet jika script dibuat standalone di script.google.com
var SPREADSHEET_ID = "";

var SHEET_NAME = "Hasil Voting";

function getSpreadsheet() {
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateVotingSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Jika sheet masih kosong, inisialisasi Header resmi
  if (sheet.getLastRow() === 0) {
    var headers = [
      "No",
      "Waktu Voting (WIB)",
      "Nama Siswa",
      "Kelas",
      "No Absen",
      "Pilihan Voting",
      "Email Akun Google",
      "UID Firebase"
    ];

    sheet.appendRow(headers);

    // Format Header Row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e293b"); // Deep Navy
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);

    // Bekukan baris pertama agar tetap terlihat saat scroll
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Endpoint POST: Menerima data voting dari web dan mencatatnya ke Google Sheets
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Tunggu hingga 10 detik jika banyak siswa yang submit bersamaan
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Data kiriman kosong."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = getSpreadsheet();
    var sheet = getOrCreateVotingSheet(ss);

    var uid = (data.uid || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var nama = (data.nama || "").toString().trim();
    var kelas = (data.kelas || "").toString().trim();
    var absen = data.absen ? parseInt(data.absen, 10) : "";
    var pilihan = (data.pilihan || "").toString().trim();
    var waktu = data.waktuFormatted || data.waktu || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    if (!pilihan) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Pilihan voting tidak boleh kosong."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    // Cek duplikasi jika sudah ada data sebelumnya
    if (lastRow > 1) {
      var rangeUid = sheet.getRange(2, 8, lastRow - 1, 1).getValues(); // Kolom UID
      var rangeStudent = sheet.getRange(2, 4, lastRow - 1, 2).getValues(); // Kolom Kelas & Absen

      for (var i = 0; i < rangeUid.length; i++) {
        var rowUid = rangeUid[i][0] ? rangeUid[i][0].toString() : "";
        var rowKelas = rangeStudent[i][0] ? rangeStudent[i][0].toString() : "";
        var rowAbsen = rangeStudent[i][1] ? parseInt(rangeStudent[i][1], 10) : "";

        // Cocokkan UID atau pasangan Kelas & Absen
        if ((uid && rowUid === uid) || (kelas && absen && rowKelas === kelas && rowAbsen === absen)) {
          existingRowIndex = i + 2; // Baris riil di sheet (offset header)
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Jika siswa sudah ada, perbarui data baris tersebut agar tidak dobel baris
      sheet.getRange(existingRowIndex, 2).setValue(waktu);
      sheet.getRange(existingRowIndex, 3).setValue(nama);
      sheet.getRange(existingRowIndex, 4).setValue(kelas);
      sheet.getRange(existingRowIndex, 5).setValue(absen);
      sheet.getRange(existingRowIndex, 6).setValue(pilihan);
      sheet.getRange(existingRowIndex, 7).setValue(email);
      sheet.getRange(existingRowIndex, 8).setValue(uid);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "updated",
        message: "Data voting siswa berhasil diperbarui di baris " + existingRowIndex,
        nama: nama,
        kelas: kelas,
        absen: absen,
        pilihan: pilihan
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Jika siswa belum ada, tambahkan baris baru di bawah
    var nextNo = lastRow; // karena baris 1 adalah header, baris 2 adalah no 1
    var rowData = [
      nextNo,
      waktu,
      nama,
      kelas,
      absen,
      pilihan,
      email,
      uid
    ];

    sheet.appendRow(rowData);
    var newRowIndex = sheet.getLastRow();

    // Beri format perataan
    sheet.getRange(newRowIndex, 1).setHorizontalAlignment("center");
    sheet.getRange(newRowIndex, 4).setHorizontalAlignment("center");
    sheet.getRange(newRowIndex, 5).setHorizontalAlignment("center");
    
    // Warna badge sesuai pilihan
    var pilihanCell = sheet.getRange(newRowIndex, 6);
    pilihanCell.setFontWeight("bold");
    if (pilihan.indexOf("Urut Absen") !== -1) {
      pilihanCell.setFontColor("#1e40af"); // Biru
    } else {
      pilihanCell.setFontColor("#7c2d12"); // Amber / Oranye
    }

    // Auto fit kolom
    for (var col = 1; col <= 8; col++) {
      sheet.autoResizeColumn(col);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: "appended",
      message: "Voting berhasil dicatat ke Google Sheet!",
      row: newRowIndex,
      nama: nama,
      kelas: kelas,
      pilihan: pilihan
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint GET: Memeriksa apakah script sudah online dan aktif
 */
function doGet(e) {
  try {
    var ss = getSpreadsheet();
    var sheet = getOrCreateVotingSheet(ss);
    var totalRows = Math.max(0, sheet.getLastRow() - 1);

    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      message: "Layanan Google Sheets Voting NEVASTRA 2026 Aktif & Siap Menerima Data!",
      sheetName: sheet.getName(),
      totalSuaraTercatat: totalRows,
      timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * FUNGSI SETUP MANUAL:
 * Jalankan fungsi ini sekali di Apps Script untuk menguji dan langsung membuat
 * Sheet "Hasil Voting" beserta headernya yang rapi.
 */
function setupManual() {
  var ss = getSpreadsheet();
  var sheet = getOrCreateVotingSheet(ss);
  Logger.log("Sukses! Sheet " + sheet.getName() + " siap digunakan.");
}
