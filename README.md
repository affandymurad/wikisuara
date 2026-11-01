# Wikisuara (WS)

Wikisuara (WS) adalah aplikasi web berbasis React JS (Vite) untuk merekam pelafalan kata dan frasa berformat WAV (PCM 16-bit mono 44.1 kHz). Aplikasi berjalan 100% di browser tanpa backend, tanpa login, dan tanpa upload ke Commons.

## Fitur Utama

- **Alur 6 Langkah Terarah:**
  1. **Profil:** Manajemen profil penutur (mendukung beberapa profil, profil utama aman).
  2. **Bahasa:** Pengelolaan bahasa yang dikuasai beserta QID Wikidata dan kode bahasa ISO, dengan pemilih bahasa aktif berbentuk kartu.
  3. **Cek Perangkat:** Pengujian izin mikrofon, indikator level audio dB realtime, dan visualizer gelombang audio (canvas).
  4. **Daftar Kata:** Input cepat teks terpisah tanda `#` (misal: `big#blue#house`), tempel banyak baris, atau unggah file `.txt`. Otomatis deduping.
  5. **Rekam:** Antarmuka perekam layar ganda dengan daftar kata, kata besar, progres, tombol Mulai/Berhenti, dan pintasan keyboard (Spasi = rekam/berhenti, Panah Kanan = kata berikutnya).
  6. **Tinjau & Publish:** Pemutar audio, centang rekaman, dan tabel berkas WAV yang siap diunduh satuan, diunduh seluruhnya dalam ZIP (JSZip), salin nama berkas, atau ekspor metadata CSV/JSON.

## Format Nama Berkas

Semua berkas yang dihasilkan mengikuti format baku:
```
WS-{QID bahasa} ({kode bahasa})-{nama penutur}-{kata}.wav
```

Contoh:
- `WS-Q33014 (bew)-Affandy Murad-bayem.wav`
- `WS-Q9240 (id)-Affandy Murad-alay.wav`
- `WS-Q1860 (en)-Affandy Murad-house.wav`

## Cara Menjalankan

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Kompilasi untuk produksi
npm run build
```
