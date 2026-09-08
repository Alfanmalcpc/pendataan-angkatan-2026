@echo off
title Upload ke GitHub Akun Angkatan (NEVASTRA / angkatan44smaness@gmail.com)
echo ===================================================================
echo     UPLOAD WEB PENDATAAN KE GITHUB ANGKATAN (NEVASTRA)
echo              Email: angkatan44smaness@gmail.com
echo ===================================================================
echo.
echo Target Repository: NEVASTRA/PENDATAAN-KAS
echo Target Website   : https://nevastra.github.io/PENDATAAN-KAS/
echo.
echo Tekan sembarang tombol untuk mulai mengunggah (push)...
echo.
pause

cd /d "%~dp0"
git remote remove origin 2>nul
git remote add origin https://github.com/NEVASTRA/PENDATAAN-KAS.git
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
echo Selesai! Web pendataan sudah aktif di GitHub Pages:
echo https://nevastra.github.io/PENDATAAN-KAS/
echo ===================================================================
pause
