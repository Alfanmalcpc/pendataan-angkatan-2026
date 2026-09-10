@echo off
title Web Pendataan Biodata Yearbook - NEVASTRA 2026
echo ===================================================================
echo           WEB PENDATAAN BIODATA YEARBOOK NEVASTRA 2026
echo                   SMAN 1 SUMBERREJO
echo ===================================================================
echo.
echo [1] PORTAL SISWA    : http://localhost:8080/index.html
echo [2] VOTING KELOMPOK : http://localhost:8080/voting.html
echo [3] PANEL ADMIN     : http://localhost:8080/admin.html
echo.
echo Membuka browser pada Panel Admin dan Portal Siswa...
echo (JANGAN TUTUP JENDELA INI SELAMA SEDANG MENGGUNAKAN WEB)
echo Tekan CTRL + C jika ingin menghentikan server web.
echo.

cd /d "%~dp0"
start http://localhost:8080/admin.html
python -m http.server 8080

pause
