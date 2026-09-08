// Koneksi Database Firebase REST API (Bekerja di file:// dan https:// tanpa masalah CORS)
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
    }
};
