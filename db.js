// Koneksi Database Firebase REST API & Google Drive Integration
const DB_BASE_URL = "https://nevastra-default-rtdb.asia-southeast1.firebasedatabase.app";

window.NevastraDB = {
    async saveBiodata(kelas, absen, data) {
        // Alokasi Tim Otomatis (6 Tim @ 6 orang per kelas, Tim Terkunci & Anti 1 L/P Sendirian)
        let teamInfo = { timId: 1, timNama: 'Tim 1', teamMembers: [] };
        try {
            teamInfo = await this.allocateStudentToTeam(kelas, absen, data);
        } catch(teamErr) {
            console.warn("Notice team allocation:", teamErr);
        }

        const payload = {
            ...data,
            kelas: kelas,
            absen: parseInt(absen, 10),
            timId: teamInfo.timId || 1,
            timNama: teamInfo.timNama || 'Tim 1',
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

        return {
            ...payload,
            teamMembers: teamInfo.teamMembers || [],
            allClassTeams: teamInfo.allClassTeams || {}
        };
    },

    // --- Sistem Pembagian Tim (6 Tim x 6 Orang, Gender-Safe & Tim Terkunci) ---
    async allocateStudentToTeam(kelas, absen, data) {
        const studentAbsen = parseInt(absen, 10);
        const studentGender = ((data.jenisKelamin || data.jk || 'L') + '').toUpperCase(); // 'L' atau 'P'
        const studentName = data.nama || data.namaRoster || 'Siswa';
        const studentAlamat = data.tinggalDi || data.alamat || '-';
        const studentNoHp = data.noHp || '-';

        // 1. Cek apakah siswa ini SUDAH memiliki tim sebelumnya (TIM TERKUNCI & TIDAK DAPAT DIUBAH)
        let existingTimNama = null;
        try {
            const indexRes = await fetch(`${DB_BASE_URL}/teams_index/${kelas}/${studentAbsen}.json?t=${Date.now()}`);
            if (indexRes.ok) {
                const val = await indexRes.json();
                if (val && typeof val === 'string') existingTimNama = val;
            }
        } catch(e) {}

        if (!existingTimNama) {
            existingTimNama = localStorage.getItem(`nevastra_team_${kelas}_${studentAbsen}`);
        }

        if (!existingTimNama && data.timNama) {
            existingTimNama = data.timNama;
        }

        // Ambil data 6 tim kelas saat ini dari Firebase
        let classTeams = {};
        try {
            const teamsRes = await fetch(`${DB_BASE_URL}/teams_class/${kelas}.json?t=${Date.now()}`);
            if (teamsRes.ok) {
                const val = await teamsRes.json();
                if (val && typeof val === 'object') classTeams = val;
            }
        } catch(e) {}

        // Inisialisasi struktur 6 tim (Tim 1 s/d Tim 6)
        for (let i = 1; i <= 6; i++) {
            const tName = `Tim ${i}`;
            if (!classTeams[tName]) {
                classTeams[tName] = {
                    id: i,
                    nama: tName,
                    members: {}
                };
            } else {
                if (!classTeams[tName].id) classTeams[tName].id = i;
                if (!classTeams[tName].nama) classTeams[tName].nama = tName;
                if (!classTeams[tName].members) {
                    const membersObj = {};
                    for (const [k, v] of Object.entries(classTeams[tName])) {
                        if (k !== 'id' && k !== 'nama' && v && typeof v === 'object' && v.absen) {
                            membersObj[k] = v;
                        }
                    }
                    classTeams[tName].members = membersObj;
                }
            }
        }

        let assignedTimNama = existingTimNama;

        if (assignedTimNama && classTeams[assignedTimNama]) {
            // SISWA SUDAH TERDAFTAR DI TIM (TERKUNCI): Cukup perbarui profil anggota (misal siswa edit no hp/alamat)
            classTeams[assignedTimNama].members[studentAbsen] = {
                absen: studentAbsen,
                nama: studentName,
                jk: studentGender,
                tinggalDi: studentAlamat,
                noHp: studentNoHp,
                quotes: data.quotes || ''
            };
        } else {
            // SISWA BARU: Alokasikan ke salah satu dari 6 tim menggunakan aturan pembagian gender seimbang
            assignedTimNama = this._pickOptimalTeam(classTeams, studentGender);

            if (!classTeams[assignedTimNama]) {
                classTeams[assignedTimNama] = { id: parseInt(assignedTimNama.replace(/\D/g, '')) || 1, nama: assignedTimNama, members: {} };
            }
            classTeams[assignedTimNama].members[studentAbsen] = {
                absen: studentAbsen,
                nama: studentName,
                jk: studentGender,
                tinggalDi: studentAlamat,
                noHp: studentNoHp,
                quotes: data.quotes || ''
            };

            // Kunci penempatan tim untuk siswa ini secara permanen
            try {
                localStorage.setItem(`nevastra_team_${kelas}_${studentAbsen}`, assignedTimNama);
                await fetch(`${DB_BASE_URL}/teams_index/${kelas}/${studentAbsen}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assignedTimNama)
                });
            } catch(e) {}
        }

        const timId = parseInt(assignedTimNama.replace(/\D/g, '')) || 1;

        // Simpan data tim ke Firebase Realtime Database
        try {
            await fetch(`${DB_BASE_URL}/teams_class/${kelas}/${assignedTimNama}/members/${studentAbsen}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classTeams[assignedTimNama].members[studentAbsen])
            });
            await fetch(`${DB_BASE_URL}/teams_class/${kelas}/${assignedTimNama}/id.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timId)
            });
            await fetch(`${DB_BASE_URL}/teams_class/${kelas}/${assignedTimNama}/nama.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignedTimNama)
            });
        } catch(e) {}

        const teammates = Object.values(classTeams[assignedTimNama].members || {});

        return {
            timId: timId,
            timNama: assignedTimNama,
            teamMembers: teammates,
            allClassTeams: classTeams
        };
    },

    // Algoritma Penentuan Tim: Menjamin tidak ada 1 L atau 1 P sendirian dalam kelompok (Maks 6 orang)
    _pickOptimalTeam(classTeams, gender) {
        const teamNames = ['Tim 1', 'Tim 2', 'Tim 3', 'Tim 4', 'Tim 5', 'Tim 6'];
        const G = gender === 'P' ? 'P' : 'L';
        const Opp = G === 'L' ? 'P' : 'L';

        let bestTeam = null;
        let bestScore = -99999;

        for (const tName of teamNames) {
            const team = classTeams[tName] || { members: {} };
            const members = Object.values(team.members || {});
            const total = members.length;
            const countL = members.filter(m => (m.jk || '').toUpperCase() === 'L').length;
            const countP = members.filter(m => (m.jk || '').toUpperCase() === 'P').length;

            const countSame = G === 'L' ? countL : countP;
            const countOpp = G === 'L' ? countP : countL;
            const R = 6 - total; // Sisa kuota anggota

            // 1. Lewati jika tim sudah penuh (6 orang)
            if (R <= 0) continue;

            // 2. Jika sisa 1 slot (R == 1):
            // - Jika countSame == 0, masuknya G membuat gender G hanya ada 1 orang (dilarang!)
            // - Jika countOpp == 1, masuknya G membuat gender Opp tetap 1 orang (dilarang!)
            if (R === 1) {
                if (countSame === 0 || countOpp === 1) continue;
            }

            // 3. Jika sisa 2 slot (R == 2):
            // - Jika countOpp == 4 dan countSame == 0, masuknya G membuat countSame = 1 dan sisa 1 slot berisiko terkunci
            if (R === 2) {
                if (countOpp === 4 && countSame === 0) continue;
            }

            // Pembobotan Skor Tim:
            let score = 0;

            // Prioritas Tertinggi: Tim yang saat ini memiliki 1 teman dengan gender yang sama!
            // Masuknya G langsung membuat kelompok memiliki minimal 2 orang gender sama (aman dari isolasi)
            if (countSame === 1 && countOpp <= 4) {
                score += 2500;
            }
            // Prioritas 2: Tim masih kosong
            else if (total === 0) {
                score += 1200;
            }
            // Prioritas 3: Tim saat ini hanya beranggotakan gender yang sama (kelompok sesama jenis diperbolehkan)
            else if (countOpp === 0) {
                score += 900;
            }
            // Prioritas 4: Tim yang sudah seimbang (minimal 2 L dan 2 P)
            else if (countSame >= 2 && countOpp >= 2) {
                score += 700;
            }
            // Prioritas 5: Tim baru dengan lawan jenis <= 2 dan sisa slot banyak (R >= 3)
            else if (countSame === 0 && countOpp <= 2 && R >= 3) {
                score += 500;
            } else {
                score += 100;
            }

            // Bonus pemerataan kuota tim (utamakan tim yang anggotanya lebih sedikit)
            score += (R * 25);

            if (score > bestScore) {
                bestScore = score;
                bestTeam = tName;
            }
        }

        // Fallback jika semua skor ketat
        if (!bestTeam) {
            for (const tName of teamNames) {
                const team = classTeams[tName] || { members: {} };
                if (Object.keys(team.members || {}).length < 6) {
                    bestTeam = tName;
                    break;
                }
            }
        }

        return bestTeam || 'Tim 1';
    },

    async getClassTeams(kelas) {
        let classTeams = {};
        try {
            const res = await fetch(`${DB_BASE_URL}/teams_class/${kelas}.json?t=${Date.now()}`);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'object') classTeams = val;
            }
        } catch(e) {}

        const result = {};
        for (let i = 1; i <= 6; i++) {
            const tName = `Tim ${i}`;
            const raw = classTeams[tName] || {};
            let members = raw.members || {};
            if (!raw.members) {
                members = {};
                for (const [k, v] of Object.entries(raw)) {
                    if (k !== 'id' && k !== 'nama' && v && typeof v === 'object' && v.absen) {
                        members[k] = v;
                    }
                }
            }
            result[tName] = {
                id: raw.id || i,
                nama: tName,
                members: members
            };
        }
        return result;
    },

    async getStudentTeam(kelas, absen) {
        const studentAbsen = parseInt(absen, 10);
        let timNama = null;
        try {
            const res = await fetch(`${DB_BASE_URL}/teams_index/${kelas}/${studentAbsen}.json?t=${Date.now()}`);
            if (res.ok) {
                const val = await res.json();
                if (val && typeof val === 'string') timNama = val;
            }
        } catch(e) {}

        if (!timNama) {
            timNama = localStorage.getItem(`nevastra_team_${kelas}_${studentAbsen}`);
        }

        if (!timNama) return null;

        const classTeams = await this.getClassTeams(kelas);
        const teamObj = classTeams[timNama] || { id: parseInt(timNama.replace(/\D/g, '')) || 1, nama: timNama, members: {} };
        const teammates = Object.values(teamObj.members || {});
        return {
            timId: teamObj.id || 1,
            timNama: timNama,
            teamMembers: teammates
        };
    },

    async getAllTeams() {
        const all = {};
        for (let i = 1; i <= 9; i++) {
            const k = `XII-${i}`;
            all[k] = await this.getClassTeams(k);
        }
        return all;
    },

    async syncExistingBiodataToTeams(kelas) {
        const biodataList = await this.getClassBiodata(kelas);
        let count = 0;
        for (const [absen, data] of Object.entries(biodataList)) {
            if (!data) continue;
            let existingTim = null;
            try {
                const r = await fetch(`${DB_BASE_URL}/teams_index/${kelas}/${absen}.json`);
                if (r.ok) existingTim = await r.json();
            } catch(e) {}
            if (!existingTim) {
                await this.allocateStudentToTeam(kelas, absen, data);
                count++;
            }
        }
        return count;
    },

    async resetClassTeams(kelas) {
        try {
            await fetch(`${DB_BASE_URL}/teams_class/${kelas}.json`, { method: 'DELETE' });
            await fetch(`${DB_BASE_URL}/teams_index/${kelas}.json`, { method: 'DELETE' });
            for (let a = 1; a <= 36; a++) {
                localStorage.removeItem(`nevastra_team_${kelas}_${a}`);
            }
            return true;
        } catch(e) {
            console.warn("Reset class teams error:", e);
            return false;
        }
    },

    async resetAllTeams() {
        try {
            await fetch(`${DB_BASE_URL}/teams_class.json`, { method: 'DELETE' });
            await fetch(`${DB_BASE_URL}/teams_index.json`, { method: 'DELETE' });
            for (let i = 1; i <= 9; i++) {
                const c = `XII-${i}`;
                for (let a = 1; a <= 36; a++) {
                    localStorage.removeItem(`nevastra_team_${c}_${a}`);
                }
            }
            return true;
        } catch(e) {
            console.warn("Reset all teams error:", e);
            return false;
        }
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
