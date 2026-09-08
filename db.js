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

        return { scriptUrl: '', folderId: '', folderUrl: '' };
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
    }
};
