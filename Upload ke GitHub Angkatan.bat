@echo off
title Upload ke GitHub (Alfanmalcpc / alfanbinkhoirul@gmail.com)
echo ===================================================================
echo     UPLOAD WEB PENDATAAN KE GITHUB (Alfanmalcpc)
echo              Email: alfanbinkhoirul@gmail.com
echo ===================================================================
echo.
echo Target Repository: Alfanmalcpc/pendataan-angkatan-2026
echo Target Website   : https://alfanmalcpc.github.io/pendataan-angkatan-2026/
echo.
echo Memulai proses upload ke GitHub...
echo.

cd /d "C:\Users\ACER\OneDrive\ANGKATAN\web pendataan"
git remote remove origin 2>nul
git remote add origin https://github.com/Alfanmalcpc/pendataan-angkatan-2026.git
git add .
git commit -m "Web Pendataan Biodata Yearbook Nevastra 2026 (Title Case)"
git branch -M main

echo.
echo Sedang mengunggah ke GitHub...
echo.
git push -u origin main --force

echo.
echo ===================================================================
echo Selesai! Web pendataan sudah aktif di GitHub Pages:
echo https://alfanmalcpc.github.io/pendataan-angkatan-2026/
echo ===================================================================
pause
