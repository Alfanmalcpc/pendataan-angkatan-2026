@echo off
title Upload ke GitHub Akun Angkatan (NEVASTRA / angkatan44smaness@gmail.com)
echo ===================================================================
echo     UPLOAD WEB PENDATAAN KE GITHUB ANGKATAN (NEVASTRA)
echo              Email: angkatan44smaness@gmail.com
echo ===================================================================
echo.
echo Target Repository: NEVASTRA/pendataan-angkatan-2026
echo Target Website   : https://nevastra.github.io/pendataan-angkatan-2026/
echo.
echo Memulai proses upload ke GitHub...
echo.

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
