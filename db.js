// Koneksi Database Firebase REST API & Google Drive Integration
const DB_BASE_URL = "https://nevastra-default-rtdb.asia-southeast1.firebasedatabase.app";

// Data Referensi Resmi Jenis Kelamin (Disinkronkan dari Absen Manual 2026 Ganjil SMAN 1 Sumberrejo)
const OFFICIAL_GENDERS = {
  "XII-1": {
    "1": "L",
    "2": "L",
    "3": "L",
    "4": "L",
    "5": "L",
    "6": "P",
    "7": "L",
    "8": "L",
    "9": "P",
    "10": "P",
    "11": "P",
    "12": "P",
    "13": "L",
    "14": "P",
    "15": "P",
    "16": "L",
    "17": "P",
    "18": "L",
    "19": "L",
    "20": "L",
    "21": "L",
    "22": "L",
    "23": "L",
    "24": "L",
    "25": "L",
    "26": "L",
    "27": "L",
    "28": "L",
    "29": "P",
    "30": "P",
    "31": "L",
    "32": "P",
    "33": "P",
    "34": "P",
    "35": "L",
    "36": "P"
  },
  "XII-2": {
    "2": "P",
    "3": "L",
    "4": "P",
    "5": "P",
    "6": "L",
    "7": "P",
    "8": "P",
    "9": "L",
    "10": "P",
    "11": "L",
    "12": "P",
    "13": "L",
    "14": "L",
    "15": "P",
    "16": "P",
    "17": "P",
    "18": "P",
    "19": "L",
    "20": "L",
    "21": "L",
    "22": "L",
    "23": "L",
    "24": "L",
    "25": "L",
    "26": "L",
    "27": "P",
    "28": "L",
    "29": "L",
    "30": "L",
    "31": "P",
    "32": "L",
    "33": "P",
    "34": "P",
    "35": "P",
    "36": "L",
    "1": "L"
  },
  "XII-3": {
    "1": "P",
    "2": "L",
    "3": "L",
    "4": "P",
    "5": "P",
    "6": "P",
    "7": "P",
    "8": "P",
    "9": "P",
    "10": "P",
    "11": "P",
    "12": "P",
    "13": "L",
    "14": "P",
    "15": "P",
    "16": "P",
    "17": "P",
    "18": "L",
    "19": "P",
    "20": "P",
    "21": "L",
    "22": "L",
    "23": "L",
    "24": "L",
    "25": "P",
    "26": "P",
    "27": "P",
    "28": "P",
    "29": "P",
    "30": "P",
    "31": "P",
    "32": "P",
    "33": "P",
    "34": "P",
    "35": "P",
    "36": "P"
  },
  "XII-4": {
    "1": "L",
    "2": "L",
    "3": "P",
    "4": "P",
    "5": "P",
    "6": "L",
    "7": "P",
    "8": "L",
    "9": "P",
    "10": "P",
    "11": "P",
    "12": "P",
    "13": "P",
    "14": "P",
    "15": "P",
    "16": "P",
    "17": "P",
    "18": "L",
    "19": "P",
    "20": "P",
    "21": "P",
    "22": "P",
    "23": "P",
    "24": "P",
    "25": "L",
    "26": "P",
    "27": "P",
    "28": "L",
    "29": "P",
    "30": "P",
    "31": "P",
    "32": "P",
    "33": "P",
    "34": "P",
    "35": "P",
    "36": "P"
  },
  "XII-5": {
    "1": "P",
    "2": "P",
    "3": "P",
    "4": "P",
    "5": "L",
    "6": "L",
    "7": "P",
    "8": "P",
    "9": "L",
    "10": "L",
    "11": "L",
    "12": "P",
    "13": "L",
    "14": "L",
    "15": "L",
    "16": "L",
    "17": "P",
    "18": "L",
    "19": "L",
    "20": "P",
    "21": "P",
    "22": "P",
    "23": "P",
    "24": "L",
    "25": "L",
    "26": "L",
    "27": "P",
    "28": "P",
    "29": "P",
    "30": "L",
    "31": "P",
    "32": "L",
    "33": "P",
    "34": "P",
    "35": "P",
    "36": "P"
  },
  "XII-6": {
    "1": "P",
    "2": "L",
    "3": "L",
    "4": "L",
    "5": "P",
    "6": "P",
    "7": "L",
    "8": "L",
    "9": "P",
    "10": "P",
    "11": "L",
    "12": "L",
    "13": "P",
    "14": "P",
    "15": "P",
    "16": "L",
    "17": "P",
    "18": "P",
    "19": "P",
    "20": "P",
    "21": "L",
    "22": "L",
    "23": "P",
    "24": "P",
    "25": "L",
    "26": "L",
    "27": "L",
    "28": "P",
    "29": "P",
    "30": "P",
    "31": "L",
    "32": "P",
    "33": "P",
    "34": "P",
    "35": "P"
  },
  "XII-7": {
    "1": "L",
    "2": "P",
    "3": "P",
    "4": "P",
    "5": "P",
    "6": "P",
    "7": "P",
    "8": "L",
    "9": "P",
    "10": "P",
    "11": "P",
    "12": "P",
    "13": "L",
    "14": "L",
    "15": "L",
    "16": "L",
    "17": "L",
    "18": "L",
    "19": "L",
    "20": "L",
    "21": "L",
    "22": "P",
    "23": "P",
    "24": "P",
    "25": "P",
    "26": "P",
    "27": "L",
    "28": "P",
    "29": "P",
    "30": "L",
    "31": "L",
    "32": "P",
    "33": "L",
    "34": "L",
    "35": "P",
    "36": "P"
  },
  "XII-8": {
    "1": "L",
    "2": "P",
    "3": "P",
    "4": "L",
    "5": "P",
    "6": "P",
    "7": "P",
    "8": "P",
    "9": "P",
    "10": "P",
    "11": "L",
    "12": "P",
    "13": "P",
    "14": "P",
    "15": "P",
    "16": "P",
    "17": "P",
    "18": "L",
    "19": "L",
    "20": "P",
    "21": "P",
    "22": "P",
    "23": "P",
    "24": "P",
    "25": "L",
    "26": "P",
    "27": "P",
    "28": "L",
    "29": "P",
    "30": "P",
    "31": "L",
    "32": "P",
    "33": "P",
    "34": "P",
    "35": "P"
  },
  "XII-9": {
    "1": "L",
    "2": "P",
    "3": "P",
    "4": "P",
    "5": "P",
    "6": "P",
    "7": "P",
    "8": "P",
    "9": "P",
    "10": "L",
    "11": "P",
    "12": "L",
    "13": "L",
    "14": "L",
    "15": "P",
    "16": "P",
    "17": "P",
    "18": "P",
    "19": "P",
    "20": "L",
    "21": "P",
    "22": "P",
    "23": "P",
    "24": "P",
    "25": "P",
    "26": "P",
    "27": "P",
    "28": "P",
    "29": "P",
    "30": "P",
    "31": "P",
    "32": "P",
    "33": "L",
    "34": "P",
    "35": "P",
    "36": "P"
  }
};


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
        const refGenders = (window.studentGenders && window.studentGenders[kelas]) || OFFICIAL_GENDERS[kelas] || {};
        const studentGender = ((data.jk || data.jenisKelamin || refGenders[studentAbsen] || 'L') + '').toUpperCase(); // 'L' atau 'P'
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
            assignedTimNama = this._pickOptimalTeam(classTeams, studentGender, kelas);

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

    // Hitung Kuota Target 6 Tim per Kelas (Berdasarkan Jumlah L & P Resmi, Anti 1 Gender Sendirian)
    getClassTeamQuotas(kelas) {
        const refGenders = (window.studentGenders && window.studentGenders[kelas]) || OFFICIAL_GENDERS[kelas] || {};
        const absens = Object.keys(refGenders);
        const classSize = absens.length || 36;
        const nL = absens.filter(a => refGenders[a] === 'L').length;
        const nP = classSize - nL;

        const teamCapacities = [6, 6, 6, 6, 6, 6];
        if (classSize === 35) {
            teamCapacities[5] = 5; // Tim 6 kapasitas 5
        }

        const maleQuotas = [0, 0, 0, 0, 0, 0];

        if (nL >= 12) {
            const baseM = Math.floor(nL / 6);
            const remM = nL % 6;
            for (let i = 0; i < 6; i++) maleQuotas[i] = baseM;
            for (let r = 0; r < remM; r++) maleQuotas[r] += 1;
        } else {
            // Jika laki-laki < 12 (misal 7 atau 8 siswa):
            // Dikelompokkan minimal 2 atau 3 anak per tim agar tidak ada 1 anak sendirian
            if (nL === 8) {
                maleQuotas[0] = 2; maleQuotas[1] = 2; maleQuotas[2] = 2; maleQuotas[3] = 2;
            } else if (nL === 7) {
                maleQuotas[0] = 3; maleQuotas[1] = 2; maleQuotas[2] = 2;
            } else {
                let left = nL;
                for (let i = 0; i < 6 && left >= 2; i++) {
                    maleQuotas[i] = 2;
                    left -= 2;
                }
                if (left > 0) maleQuotas[0] += left;
            }
        }

        const quotas = {};
        for (let i = 0; i < 6; i++) {
            const tName = `Tim ${i + 1}`;
            quotas[tName] = {
                capacity: teamCapacities[i],
                L: maleQuotas[i],
                P: teamCapacities[i] - maleQuotas[i]
            };
        }
        return quotas;
    },

    // Algoritma Penentuan Tim Acak Berdasarkan Kuota Gender (Anti 1 Gender Sendirian)
    _pickOptimalTeam(classTeams, gender, kelas) {
        const teamNames = ['Tim 1', 'Tim 2', 'Tim 3', 'Tim 4', 'Tim 5', 'Tim 6'];
        const G = gender === 'P' ? 'P' : 'L';
        const quotas = this.getClassTeamQuotas(kelas || 'XII-1');

        // Cari semua tim yang masih memiliki sisa kuota untuk gender G
        const eligibleTeams = teamNames.filter(tName => {
            const team = classTeams[tName] || { members: {} };
            const members = Object.values(team.members || {});
            const currentGCount = members.filter(m => (m.jk || '').toUpperCase() === G).length;
            const currentTotal = members.length;
            const targetG = (quotas[tName] && quotas[tName][G] !== undefined) ? quotas[tName][G] : 3;
            const cap = (quotas[tName] && quotas[tName].capacity) ? quotas[tName].capacity : 6;
            return currentGCount < targetG && currentTotal < cap;
        });

        if (eligibleTeams.length > 0) {
            // Sisa siswa ditaruh secara acak di tim yang masih eligible!
            const chosen = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
            return chosen;
        }

        // Fallback: Tim mana pun yang masih memiliki slot kosong (< kapasitas)
        for (const tName of teamNames) {
            const team = classTeams[tName] || { members: {} };
            const cap = (quotas[tName] && quotas[tName].capacity) ? quotas[tName].capacity : 6;
            if (Object.keys(team.members || {}).length < cap) {
                return tName;
            }
        }

        return 'Tim 1';
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
