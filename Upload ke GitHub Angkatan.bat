@echo off
title Upload ke GitHub Akun Angkatan (NEVASTRA / angkatan44smaness@gmail.com)
echo ===================================================================
echo     UPLOAD WEB PENDATAAN KE GITHUB ANGKATAN (NEVASTRA)
echo              Email: angkatan44smaness@gmail.com
echo ===================================================================
echo.
echo Langkah mudah:
echo 1. Pastikan sudah membuat repository kosong di GitHub NEVASTRA:
echo    https://github.com/new
echo    Nama Repository : pendataan-angkatan-2026
echo    Jenis           : Public
echo.
echo 2. Jika repository sudah ada, tekan sembarang tombol untuk upload (push).
echo.
pause

cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/NEVASTRA/pendataan-angkatan-2026.git
git add .
git commit -m "Web Pendataan Biodata Yearbook Nevastra 2026 (Title Case)"
git branch -M main

echo.
echo Sedang mengunggah ke GitHub...
echo (Jika muncul jendela browser, silakan login dengan akun angkatan44smaness@gmail.com)
echo.
git push -u origin main --force

echo.
echo ===================================================================
echo Selesai! Aktifkan GitHub Pages di:
echo https://github.com/NEVASTRA/pendataan-angkatan-2026/settings/pages
echo Pilih Branch: main, Folder: / (root), lalu klik Save.
echo ===================================================================
pause
