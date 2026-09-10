// Koneksi Database Firebase REST API & Google Drive Integration
const DB_BASE_URL = "https://nevastra-default-rtdb.asia-southeast1.firebasedatabase.app";

window.NevastraDB = {
    async saveBiodata(kelas, absen, data) {
        const payload = {
            ...data,
            kelas: kelas,
            absen: parseInt(absen, 10),
            updatedAt: new Date().toISOString(),
            updatedAtFormatted: new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(new Date())
        };

        // Simpan backup lokal di browser
        try {
            localStorage.setItem(`nevastra_${kelas}_${absen}`, JSON.stringify(payload));
        } catch(e) {}

        // Simpan ke Firebase Realtime Database
        try {
            const url = `${DB_BASE_URL}/biodata/${kelas}/${absen}.json`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                console.warn("HTTP response not ok, saved locally");
            }
        } catch (netErr) {
            console.warn("Offline/Network error, saved locally:", netErr);
        }
        return payload;
    },

    async getClassBiodata(kelas) {
        try {
            const url = `${DB_BASE_URL}/biodata/${kelas}.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') return val;
            }
        } catch (e) {
            console.warn("Fetch class error:", e);
        }

        // Backup local storage jika offline
        const localData = {};
        for (let a = 1; a <= 36; a++) {
            const raw = localStorage.getItem(`nevastra_${kelas}_${a}`);
            if (raw) {
                try { localData[a] = JSON.parse(raw); } catch(ex) {}
            }
        }
        return localData;
    },

    async getAllBiodata() {
        try {
            const url = `${DB_BASE_URL}/biodata.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') return val;
            }
        } catch (e) {
            console.warn("Fetch all error:", e);
        }
        return {};
    },

    async deleteBiodata(kelas, absen) {
        try {
            localStorage.removeItem(`nevastra_${kelas}_${absen}`);
        } catch(e) {}

        try {
            const url = `${DB_BASE_URL}/biodata/${kelas}/${absen}.json`;
            await fetch(url, { method: 'DELETE' });
        } catch(e) {
            console.warn("Delete error:", e);
        }
    },

    // --- Google Drive Config & Upload ---
    async getDriveConfig() {
        try {
            const url = `${DB_BASE_URL}/settings/driveConfig.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object' && val.scriptUrl) {
                    try { localStorage.setItem('nevastra_driveConfig', JSON.stringify(val)); } catch(e){}
                    return val;
                }
            }
        } catch(e) {}

        // Local storage fallback
        try {
            const local = localStorage.getItem('nevastra_driveConfig');
            if (local) return JSON.parse(local);
        } catch(e) {}

        return { 
            scriptUrl: 'https://script.google.com/macros/s/AKfycbwVA2crgxUQf63XoxKxI_gpvUtiXDdGtq5_CQVF-i-DOb8EOmdndAEbIkQavGCRYuH1/exec', 
            folderId: '', 
            folderUrl: '' 
        };
    },

    async saveDriveConfig(config) {
        try {
            localStorage.setItem('nevastra_driveConfig', JSON.stringify(config));
        } catch(e) {}

        try {
            const url = `${DB_BASE_URL}/settings/driveConfig.json`;
            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            return true;
        } catch(e) {
            console.warn("Error saving drive config:", e);
            return false;
        }
    },

    async uploadFotoToDrive(scriptUrl, payload) {
        if (!scriptUrl) {
            throw new Error("URL Google Apps Script belum diisi di sistem.");
        }

        // Gunakan text/plain untuk melewati batasan CORS preflight OPTIONS pada Google Apps Script
        const res = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.status !== 'success') {
            throw new Error(json.message || "Gagal mengunggah foto ke Google Drive.");
        }
        return json;
    },

    // --- Sistem Voting Angkatan 2026 ---
    async saveVote(voteData) {
        const { uid, email, nama, kelas, absen, pilihan, pilihanKode } = voteData;
        const now = new Date();
        const payload = {
            uid: uid,
            email: email,
            nama: nama,
            kelas: kelas,
            absen: parseInt(absen, 10),
            pilihan: pilihan,
            pilihanKode: pilihanKode || (pilihan.indexOf('Urut Absen') !== -1 ? 'urut_absen' : 'acak_sistem'),
            votedAt: now.toISOString(),
            votedAtFormatted: new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(now)
        };

        // 1. Simpan backup lokal di browser
        try {
            localStorage.setItem(`nevastra_vote_${uid}`, JSON.stringify(payload));
        } catch(e) {}

        // 2. Simpan vote di Firebase Realtime Database berdasarkan UID
        try {
            const voteUrl = `${DB_BASE_URL}/voting/votes/${uid}.json`;
            await fetch(voteUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch(e) {
            console.warn("Error saving vote to Firebase RTDB:", e);
        }

        // 3. Catat indeks siswa (Kelas + Absen) untuk mencegah akun lain mengklaim nama & absen yang sama
        try {
            const studentKey = `${kelas}_${absen}`;
            const studentUrl = `${DB_BASE_URL}/voting/by_student/${studentKey}.json`;
            await fetch(studentUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: uid,
                    email: email,
                    nama: nama,
                    votedAt: payload.votedAt
                })
            });
        } catch(e) {
            console.warn("Error indexing student vote:", e);
        }

        return payload;
    },

    async getVoteByUid(uid) {
        if (!uid) return null;
        try {
            const url = `${DB_BASE_URL}/voting/votes/${uid}.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') return val;
            }
        } catch(e) {
            console.warn("Error fetching vote by UID:", e);
        }

        // Fallback local storage
        try {
            const local = localStorage.getItem(`nevastra_vote_${uid}`);
            if (local) return JSON.parse(local);
        } catch(e) {}
        return null;
    },

    async checkStudentVoted(kelas, absen) {
        if (!kelas || !absen) return null;
        try {
            const studentKey = `${kelas}_${absen}`;
            const url = `${DB_BASE_URL}/voting/by_student/${studentKey}.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') return val;
            }
        } catch(e) {
            console.warn("Error checking student vote:", e);
        }
        return null;
    },

    async getAllVotes() {
        try {
            const url = `${DB_BASE_URL}/voting/votes.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') return val;
            }
        } catch(e) {
            console.warn("Error fetching all votes:", e);
        }
        return {};
    },

    async deleteVote(uid, kelas, absen) {
        try {
            localStorage.removeItem(`nevastra_vote_${uid}`);
        } catch(e) {}

        try {
            await fetch(`${DB_BASE_URL}/voting/votes/${uid}.json`, { method: 'DELETE' });
            if (kelas && absen) {
                await fetch(`${DB_BASE_URL}/voting/by_student/${kelas}_${absen}.json`, { method: 'DELETE' });
            }
        } catch(e) {
            console.warn("Error deleting vote:", e);
        }
    },

    // --- Pengaturan Google Sheets Voting ---
    async getVotingSheetConfig() {
        try {
            const url = `${DB_BASE_URL}/settings/votingSheetConfig.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object' && val.scriptUrl) {
                    try { localStorage.setItem('nevastra_votingSheetConfig', JSON.stringify(val)); } catch(e){}
                    return val;
                }
            }
        } catch(e) {}

        // Local storage fallback
        try {
            const local = localStorage.getItem('nevastra_votingSheetConfig');
            if (local) return JSON.parse(local);
        } catch(e) {}

        return {
            scriptUrl: '',
            spreadsheetUrl: ''
        };
    },

    async saveVotingSheetConfig(config) {
        try {
            localStorage.setItem('nevastra_votingSheetConfig', JSON.stringify(config));
        } catch(e) {}

        try {
            const url = `${DB_BASE_URL}/settings/votingSheetConfig.json`;
            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            return true;
        } catch(e) {
            console.warn("Error saving voting sheet config:", e);
            return false;
        }
    },

    async submitVoteToSheet(scriptUrl, votePayload) {
        if (!scriptUrl || typeof scriptUrl !== 'string' || !scriptUrl.trim()) {
            return { status: "skipped", message: "URL Google Sheets belum diatur." };
        }

        try {
            const res = await fetch(scriptUrl.trim(), {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(votePayload)
            });
            const json = await res.json();
            return json;
        } catch(e) {
            console.warn("Kirim ke Google Sheets error / CORS warning:", e);
            return { status: "sent_pending", message: "Data telah dikirimkan ke Google Sheet." };
        }
    }
};
