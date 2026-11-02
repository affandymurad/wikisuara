# Wikisuara (WS)

Wikisuara (WS) adalah aplikasi web berbasis React JS (Vite) untuk merekam pelafalan kata dan frasa berformat WAV (PCM 16-bit mono 44.1 kHz). Aplikasi berjalan 100% di browser tanpa backend, tanpa login, dan tanpa upload ke Commons.

## Fitur Utama

- **Alur 6 Langkah Terarah:**
  1. **Profil:** Manajemen profil penutur (mendukung beberapa profil). Nama beraksara non-Latin wajib disertai latinisasi.
  2. **Bahasa:** Pengelolaan bahasa yang dikuasai per profil penutur (awalnya kosong) beserta QID Wikidata dan kode bahasa ISO, dengan pemilih bahasa aktif berbentuk kartu.
  3. **Cek Perangkat:** Pengujian izin mikrofon, indikator level audio dB realtime, dan visualizer gelombang audio (canvas).
  4. **Daftar Kata:** Tambah kata atau frasa satu per satu lewat formulir (Enter untuk menambah); chip hanya untuk melihat dan menghapus. Jika kata beraksara non-Latin, kolom latinisasi muncul dan wajib diisi. Otomatis deduping.
  5. **Rekam:** Antarmuka perekam layar ganda dengan daftar kata, kata besar, progres, tombol Mulai/Berhenti, dan pintasan keyboard (Spasi = rekam/berhenti, Panah Kanan = kata berikutnya).
  6. **Tinjau & Unggah:** Pemutar audio, centang rekaman, dan tabel berkas WAV yang siap diunduh satuan, diunduh seluruhnya dalam ZIP (JSZip), dan unduh daftar berkas sebagai PDF.

## Format Nama Berkas

Semua berkas yang dihasilkan mengikuti format baku:
```
WS-{QID bahasa} ({kode bahasa})-{kemahiran}-{nama penutur}-{kata}.wav
```

Kemahiran memakai kode Babel (N, 5, 4, 3, 2, 1, 0).

Contoh:
- `WS-Q33014 (bew)-2-Affandy Murad-babe.wav`
- `WS-Q9240 (id)-N-Affandy Murad-alay.wav`
- `WS-Q7737 (ru)-3-Иван (Ivan)-привет (privet).wav` (aksara non-Latin disertai latinisasi dalam kurung)

## Cara Menjalankan

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Kompilasi untuk produksi
npm run build
```
