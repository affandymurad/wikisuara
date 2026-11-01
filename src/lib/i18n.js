import { createContext, useContext, useState, useEffect, createElement } from 'react';

export const DICTIONARY = {
  id: {
    appName: 'Wikisuara',
    appShort: 'WS',
    appTagline: 'Perekam Suara Terbuka',
    heroBadge: 'Gratis · tanpa login · langsung di browser',
    heroTitle: 'Rekam pelafalan kata untuk',
    heroTitleEm: 'Wikisuara.',
    heroLead: 'Alat perekam suara kata dan frasa berformat WAV (PCM 16-bit) standar studio. Tersimpan aman di peramban Anda, siap diunduh satuan atau sekaligus sebagai ZIP.',
    chipWav: 'WAV 16-bit Mono',
    chipNoLogin: '100% di browser',
    chipAutoNaming: 'Penamaan Otomatis Baku',
    chipZipExport: 'Ekspor ZIP',
    aboutBtn: 'Apa itu Wikisuara?',
    aboutTitle: 'Apa itu Wikisuara?',
    aboutP1: 'Wikisuara adalah alat bantu perekam suara terbuka untuk merekam pelafalan kata dan frasa dalam berbagai bahasa, terutama bahasa daerah dan bahasa yang kurang terdokumentasi, sebagai bahan proyek Wikimedia seperti Wikimedia Commons dan Wiktionary.',
    aboutP2: 'Rekaman disimpan sebagai berkas WAV (PCM 16-bit mono) dengan nama baku WS-{QID} ({kode})-{penutur}-{kata}.wav, lalu bisa diunduh satuan atau sekaligus dalam ZIP.',
    aboutP3: 'Semua berjalan 100% di browser Anda: tanpa login, tanpa server, dan tidak ada data yang diunggah. Kontribusi ke Wikimedia Commons dilakukan sendiri oleh Anda.',
    aboutClose: 'Tutup',
    authorBtn: 'Affandy Murad',

    // Stepper
    step1Title: 'Profil',
    step1Desc: 'Nama penutur',
    step2Title: 'Bahasa',
    step2Desc: 'Pilih bahasa rekaman',
    step3Title: 'Cek Perangkat',
    step3Desc: 'Izin mikrofon & level',
    step4Title: 'Daftar Kata',
    step4Desc: 'Input kata & frasa',
    step5Title: 'Rekam',
    step5Desc: 'Studio perekaman',
    step6Title: 'Tinjau & Publish',
    step6Desc: 'Daftar berkas WAV & unduh',

    // Navigation buttons
    btnPrev: 'Sebelumnya',
    btnNext: 'Berikutnya',
    btnRestart: 'Mulai Ulang',
    btnConfirmRestart: 'Apakah Anda yakin ingin menghapus semua rekaman, daftar kata, dan mulai dari awal?',
    restartSuccess: 'Semua data lokal telah dibersihkan.',

    // Step 1: Profil
    profileEyebrow: 'Langkah 1 dari 6',
    profileTitle: 'Profil Penutur',
    profileLead: 'Tentukan nama penutur yang akan dicantumkan pada nama berkas rekaman.',
    profileLabel: 'Nama Penutur (Wajib)',
    profilePlaceholder: 'Contoh: Affandy Murad',
    profileInfo: 'Nama penutur ditulis apa adanya pada nama berkas, spasi dipertahankan.',
    profileActiveBadge: 'Aktif',
    profileAddBtn: 'Tambah Profil Baru',
    profileDeleteBtn: 'Hapus',
    profileDefaultBadge: 'Profil Utama',
    profileCannotDeleteDefault: 'Profil utama tidak bisa dihapus.',
    profileNameRequired: 'Nama penutur tidak boleh kosong.',

    // Step 2: Bahasa
    langEyebrow: 'Langkah 2 dari 6',
    langTitle: 'Bahasa yang Dikuasai',
    langLead: 'Pilih satu bahasa aktif untuk sesi rekaman ini. Anda dapat menambahkan bahasa lain dan mengatur tingkat kemahiran.',
    langActiveSectionTitle: 'Pilih Bahasa Rekaman Aktif',
    langListSectionTitle: 'Daftar Bahasa Tersimpan',
    langAddBtn: 'Tambah Bahasa Lain',
    langSearchPlaceholder: 'Cari bahasa di Wikidata (mis. Sunda, Minangkabau, Japanese)...',
    langSearching: 'Mencari di Wikidata...',
    langSearchEmpty: 'Tidak ditemukan bahasa di Wikidata. Gunakan input manual.',
    langManualTitle: 'Input Manual Bahasa',
    langNameInput: 'Nama Bahasa',
    langQidInput: 'QID Wikidata (mis. Q9240)',
    langCodeInput: 'Kode Bahasa (mis. id, bew, en)',
    langLevelLabel: 'Kemahiran',
    levelNative: 'Penutur Asli (Native)',
    levelMedium: 'Menengah (Medium)',
    levelBeginner: 'Pemula (Beginner)',
    langSaveBtn: 'Simpan Bahasa',
    langCancelBtn: 'Batal',
    langRequiredQidWarning: 'Bahasa aktif harus memiliki QID Wikidata dan Kode Bahasa sebelum rekaman dapat dipublikasikan.',
    langSelectedBadge: 'Bahasa Aktif',
    langActiveNotice: 'Sesi rekaman saat ini menggunakan bahasa:',

    // Step 3: Hardware
    hwEyebrow: 'Langkah 3 dari 6',
    hwTitle: 'Cek Perangkat & Mikrofon',
    hwLead: 'Pastikan mikrofon berfungsi dengan baik dan izin mikrofon telah diberikan.',
    hwPermissionTitle: 'Status Izin Mikrofon',
    hwPermGranted: 'Izin mikrofon telah diberikan',
    hwPermDenied: 'Izin mikrofon ditolak oleh browser',
    hwPermPrompt: 'Izin mikrofon belum diberikan',
    hwRequestPermBtn: 'Buka Ulang Izin Mikrofon',
    hwTestingTitle: 'Uji Mikrofon & Visualisasi Suara',
    hwStartTestBtn: 'Mulai Tes Mikrofon',
    hwStopTestBtn: 'Hentikan Tes',
    hwLevelLabel: 'Tingkat Sinyal Suara:',
    hwNotSupported: 'Browser Anda tidak mendukung perekaman audio MediaRecorder.',
    hwPermDeniedHelp: 'Klik ikon kunci atau kamera/mikrofon di bilah alamat browser untuk mengizinkan akses mikrofon, lalu klik "Buka Ulang Izin Mikrofon".',
    hwTestInstruction: 'Bicaralah dengan suara normal ke arah mikrofon untuk melihat gelombang dan indikator sinyal audio.',

    // Step 4: List
    listEyebrow: 'Langkah 4 dari 6',
    listTitle: 'Daftar Kata untuk Direkam',
    listLead: 'Masukkan kata atau frasa yang ingin direkam. Anda dapat menggunakan pemisah tanda pagar (#), tempel baris, atau mengimpor berkas teks.',
    listInputLabel: 'Input Kata / Teks',
    listInputPlaceholder: 'Ketik kata atau frasa... Contoh pemisah tagar: bayem#alay#rumah#axes (weapons)',
    listAddBtn: 'Tambahkan ke Daftar',
    listImportTxtBtn: 'Impor Berkas .txt',
    listClearBtn: 'Bersihkan Daftar',
    listClearConfirm: 'Apakah Anda yakin ingin menghapus semua kata dalam daftar?',
    listTotalItems: 'Total Kata:',
    listEmptyState: 'Belum ada kata dalam daftar. Masukkan teks di atas atau impor berkas .txt.',
    listDuplicateIgnored: 'Kata duplikat diabaikan otomatis.',
    listDeleteItem: 'Hapus kata ini',

    // Step 5: Record
    recEyebrow: 'Langkah 5 dari 6',
    recTitle: 'Studio Perekaman',
    recLead: 'Rekam pelafalan setiap kata. Gunakan tombol di layar atau pintasan keyboard untuk mempercepat.',
    recItemListTitle: 'Daftar Kata',
    recStatusUnrecorded: 'Belum direkam',
    recStatusRecorded: 'Sudah direkam',
    recPlayBtn: 'Putar',
    recReRecordBtn: 'Rekam Ulang',
    recDeleteAudioBtn: 'Hapus Audio',
    recStartBtn: 'Mulai Rekam',
    recStopBtn: 'Berhenti Rekam',
    recNextWordBtn: 'Kata Berikutnya',
    recPrevWordBtn: 'Kata Sebelumnya',
    recProgressLabel: 'Progres Sesi:',
    recShortcutsTitle: 'Pintasan Keyboard:',
    recShortcutSpace: 'Spasi: Mulai / Berhenti Rekam',
    recShortcutRight: 'Panah Kanan (→): Kata Berikutnya',
    recShortcutLeft: 'Panah Kiri (←): Kata Sebelumnya',
    recTooShortWarning: 'Durasi rekaman terlalu singkat (kurang dari 0,2 detik). Silakan rekam ulang.',
    recCompletedNotice: 'Semua kata telah direkam! Anda siap untuk meninjau dan mengunduh berkas.',

    // Step 6: Review & Publish
    revEyebrow: 'Langkah 6 dari 6',
    revTitle: 'Tinjau & Publish',
    revLead: 'Dengarkan kembali rekaman Anda, pilih rekaman yang valid, lalu buat berkas WAV berkualitas tinggi.',
    revSelectAll: 'Pilih Semua',
    revUnselectAll: 'Batalkan Semua',
    revSelectedCount: '{selected} dari {total} rekaman terpilih',
    revPlayAllBtn: 'Putar Semua Berurutan',
    revStopPlayAllBtn: 'Hentikan Putar Semua',
    revPlayerTitle: 'Pemutar Audio',
    revPublishBtn: 'Publish!',
    revPublishHint: 'Tombol Publish tidak mengunggah data ke Wikimedia Commons. Klik untuk melihat daftar berkas WAV yang siap diunduh.',
    revPublishDisabledReason: 'Pastikan minimal 1 rekaman dicentang dan QID bahasa aktif telah terisi.',
    revNoRecordings: 'Belum ada rekaman yang tersedia. Silakan lakukan rekaman pada Langkah 5.',

    // Publish WAV Panel
    pubPanelTitle: 'Daftar Berkas WAV (Wikisuara)',
    pubPanelDesc: 'Semua berkas audio telah didekode dan di-encode ke format WAV (PCM 16-bit mono 44.1 kHz). Siap diunduh satuan atau ZIP.',
    pubDownloadZipBtn: 'Unduh Semua (ZIP)',
    pubCopyNamesBtn: 'Salin Semua Nama Berkas',
    pubNamesCopied: 'Semua nama berkas berhasil disalin ke papan klip!',
    pubColNo: '#',
    pubColFileName: 'Nama Berkas',
    pubColDuration: 'Durasi',
    pubColSize: 'Ukuran',
    pubColDescription: 'Deskripsi',
    pubDescription: 'Rekaman pelafalan "{word}" dalam bahasa {language} ({code}) oleh {speaker}.',
    pubClearBtn: 'Clear',
    pubClearConfirm: 'Hapus semua rekaman di daftar ini?',
    pubClearYes: 'Ya, Hapus',
    pubClearCancel: 'Batal',
    pubCleared: 'Daftar berkas dikosongkan',
    pubColAction: 'Aksi',
    pubDownloadSingle: 'Unduh',
    pubCopySingleName: 'Salin Nama',
    pubSingleNameCopied: 'Nama disalin!',
    pubConverting: 'Memproses audio ke WAV...',
    pubZipPreparing: 'Menyiapkan arsip ZIP...',
    pubStorageNotice: 'Catatan Privasi: Semua berkas audio diproses dan disimpan 100% di browser lokal Anda (IndexedDB & Memory). Tidak ada data yang dikirim ke server mana pun.',

    // Footer
    footerNote: 'Alat bantu perekam suara terbuka · 100% di browser tanpa backend.',
    themeToggle: 'Ganti Tema',
    langToggle: 'Ganti Bahasa',
  },
  en: {
    appName: 'Wikisuara',
    appShort: 'WS',
    appTagline: 'Open Voice Recorder',
    heroBadge: 'Free · no login · right in your browser',
    heroTitle: 'Record spoken words for',
    heroTitleEm: 'Wikisuara.',
    heroLead: 'A studio-grade word and phrase voice recorder in standard WAV (16-bit PCM mono). Safely stored in your browser, ready for single or bulk ZIP download.',
    chipWav: 'WAV 16-bit Mono',
    chipNoLogin: '100% in browser',
    chipAutoNaming: 'Standard Auto-Naming',
    chipZipExport: 'ZIP Export',
    aboutBtn: 'What is Wikisuara?',
    aboutTitle: 'What is Wikisuara?',
    aboutP1: 'Wikisuara is an open voice recording tool for capturing the pronunciation of words and phrases in many languages, especially regional and under-documented ones, as material for Wikimedia projects such as Wikimedia Commons and Wiktionary.',
    aboutP2: 'Recordings are saved as WAV files (PCM 16-bit mono) with the standard name WS-{QID} ({code})-{speaker}-{word}.wav, ready to download one by one or all at once as a ZIP.',
    aboutP3: 'Everything runs 100% in your browser: no login, no server, and nothing is uploaded. Contributing to Wikimedia Commons is done by you.',
    aboutClose: 'Close',
    authorBtn: 'Affandy Murad',

    // Stepper
    step1Title: 'Profile',
    step1Desc: 'Speaker name',
    step2Title: 'Languages',
    step2Desc: 'Pick recording language',
    step3Title: 'Device Check',
    step3Desc: 'Mic permission & level',
    step4Title: 'Word List',
    step4Desc: 'Input words & phrases',
    step5Title: 'Record',
    step5Desc: 'Recording studio',
    step6Title: 'Review & Publish',
    step6Desc: 'WAV file list & download',

    // Navigation buttons
    btnPrev: 'Previous',
    btnNext: 'Next',
    btnRestart: 'Start Over',
    btnConfirmRestart: 'Are you sure you want to delete all recordings, word lists, and start from scratch?',
    restartSuccess: 'All local data has been cleared.',

    // Step 1: Profil
    profileEyebrow: 'Step 1 of 6',
    profileTitle: 'Speaker Profile',
    profileLead: 'Specify the speaker name to be included in the audio filename.',
    profileLabel: 'Speaker Name (Required)',
    profilePlaceholder: 'Example: Affandy Murad',
    profileInfo: 'Speaker name is written as-is in the filename, spaces are preserved.',
    profileActiveBadge: 'Active',
    profileAddBtn: 'Add New Profile',
    profileDeleteBtn: 'Delete',
    profileDefaultBadge: 'Primary Profile',
    profileCannotDeleteDefault: 'Primary profile cannot be deleted.',
    profileNameRequired: 'Speaker name cannot be empty.',

    // Step 2: Bahasa
    langEyebrow: 'Step 2 of 6',
    langTitle: 'Languages Mastered',
    langLead: 'Pick one active language for this recording session. You can add more languages and configure proficiency.',
    langActiveSectionTitle: 'Pick Active Recording Language',
    langListSectionTitle: 'Saved Languages',
    langAddBtn: 'Add Another Language',
    langSearchPlaceholder: 'Search language on Wikidata (e.g. Sunda, Betawi, French)...',
    langSearching: 'Searching Wikidata...',
    langSearchEmpty: 'No language found on Wikidata. Use manual input.',
    langManualTitle: 'Manual Language Input',
    langNameInput: 'Language Name',
    langQidInput: 'Wikidata QID (e.g. Q9240)',
    langCodeInput: 'Language Code (e.g. id, bew, en)',
    langLevelLabel: 'Proficiency',
    levelNative: 'Native Speaker',
    levelMedium: 'Medium',
    levelBeginner: 'Beginner',
    langSaveBtn: 'Save Language',
    langCancelBtn: 'Cancel',
    langRequiredQidWarning: 'Active language must have a valid Wikidata QID and Language Code before publishing.',
    langSelectedBadge: 'Active Language',
    langActiveNotice: 'Current recording session uses language:',

    // Step 3: Hardware
    hwEyebrow: 'Step 3 of 6',
    hwTitle: 'Device & Microphone Check',
    hwLead: 'Ensure your microphone works properly and browser permission is granted.',
    hwPermissionTitle: 'Microphone Permission Status',
    hwPermGranted: 'Microphone permission granted',
    hwPermDenied: 'Microphone permission denied by browser',
    hwPermPrompt: 'Microphone permission not yet granted',
    hwRequestPermBtn: 'Reopen Permission Prompt',
    hwTestingTitle: 'Microphone Test & Waveform Visualization',
    hwStartTestBtn: 'Start Mic Test',
    hwStopTestBtn: 'Stop Test',
    hwLevelLabel: 'Audio Signal Level:',
    hwNotSupported: 'Your browser does not support MediaRecorder audio recording.',
    hwPermDeniedHelp: 'Click the padlock or microphone icon in your browser address bar to allow microphone access, then click "Reopen Permission Prompt".',
    hwTestInstruction: 'Speak in a normal voice towards your microphone to verify waveform and audio signal levels.',

    // Step 4: List
    listEyebrow: 'Step 4 of 6',
    listTitle: 'Word List for Recording',
    listLead: 'Enter words or phrases to record. You can use hash (#) separator, paste multiple lines, or import a text file.',
    listInputLabel: 'Word / Text Input',
    listInputPlaceholder: 'Type word or phrases... Hash separator example: bayem#alay#house#axes (weapons)',
    listAddBtn: 'Add to List',
    listImportTxtBtn: 'Import .txt File',
    listClearBtn: 'Clear List',
    listClearConfirm: 'Are you sure you want to remove all words in the list?',
    listTotalItems: 'Total Words:',
    listEmptyState: 'No words in the list yet. Enter text above or import a .txt file.',
    listDuplicateIgnored: 'Duplicate words are ignored automatically.',
    listDeleteItem: 'Remove this word',

    // Step 5: Record
    recEyebrow: 'Step 5 of 6',
    recTitle: 'Recording Studio',
    recLead: 'Record pronunciation for each item. Use on-screen controls or keyboard shortcuts for speed.',
    recItemListTitle: 'Word List',
    recStatusUnrecorded: 'Not recorded',
    recStatusRecorded: 'Recorded',
    recPlayBtn: 'Play',
    recReRecordBtn: 'Re-record',
    recDeleteAudioBtn: 'Delete Audio',
    recStartBtn: 'Start Recording',
    recStopBtn: 'Stop Recording',
    recNextWordBtn: 'Next Word',
    recPrevWordBtn: 'Previous Word',
    recProgressLabel: 'Session Progress:',
    recShortcutsTitle: 'Keyboard Shortcuts:',
    recShortcutSpace: 'Space: Start / Stop Recording',
    recShortcutRight: 'Right Arrow (→): Next Word',
    recShortcutLeft: 'Left Arrow (←): Previous Word',
    recTooShortWarning: 'Recording duration too short (less than 0.2s). Please re-record.',
    recCompletedNotice: 'All words recorded! You are ready to review and download files.',

    // Step 6: Review & Publish
    revEyebrow: 'Step 6 of 6',
    revTitle: 'Review & Publish',
    revLead: 'Listen to your recordings, select valid files, and produce high-quality WAV files.',
    revSelectAll: 'Select All',
    revUnselectAll: 'Unselect All',
    revSelectedCount: '{selected} of {total} recordings selected',
    revPlayAllBtn: 'Play All Sequentially',
    revStopPlayAllBtn: 'Stop Play All',
    revPlayerTitle: 'Audio Player',
    revPublishBtn: 'Publish!',
    revPublishHint: 'The Publish button does not upload data to Wikimedia Commons. Click to view the WAV file list ready for download.',
    revPublishDisabledReason: 'Ensure at least 1 recording is checked and the active language has a valid QID.',
    revNoRecordings: 'No recordings available yet. Please complete recordings in Step 5.',

    // Publish WAV Panel
    pubPanelTitle: 'WAV Files List (Wikisuara)',
    pubPanelDesc: 'All audio recordings have been decoded and encoded to PCM 16-bit mono 44.1 kHz WAV format. Ready for single or ZIP download.',
    pubDownloadZipBtn: 'Download All (ZIP)',
    pubCopyNamesBtn: 'Copy All Filenames',
    pubNamesCopied: 'All filenames copied to clipboard!',
    pubColNo: '#',
    pubColFileName: 'Filename',
    pubColDuration: 'Duration',
    pubColSize: 'Size',
    pubColDescription: 'Description',
    pubDescription: 'Pronunciation of "{word}" in {language} ({code}) spoken by {speaker}.',
    pubClearBtn: 'Clear',
    pubClearConfirm: 'Delete all recordings in this list?',
    pubClearYes: 'Yes, Delete',
    pubClearCancel: 'Cancel',
    pubCleared: 'File list cleared',
    pubColAction: 'Action',
    pubDownloadSingle: 'Download',
    pubCopySingleName: 'Copy Name',
    pubSingleNameCopied: 'Copied!',
    pubConverting: 'Processing audio to WAV...',
    pubZipPreparing: 'Preparing ZIP archive...',
    pubStorageNotice: 'Privacy Notice: All audio files are processed and stored 100% in your local browser (IndexedDB & Memory). No data is sent to any server.',

    // Footer
    footerNote: 'Open voice recording tool · 100% in browser without backend.',
    themeToggle: 'Switch Theme',
    langToggle: 'Switch Language',
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('language');
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  const toggleLanguage = () => {
    const next = lang === 'id' ? 'en' : 'id';
    setLang(next);
    try {
      localStorage.setItem('language', next);
    } catch {
      // Ignore
    }
    document.documentElement.lang = next;
  };

  const t = (key, vars = {}) => {
    let str = DICTIONARY[lang]?.[key] || DICTIONARY.id[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return createElement(
    I18nContext.Provider,
    { value: { lang, toggleLanguage, t } },
    children
  );
}

export function useT() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'id',
      toggleLanguage: () => {},
      t: (key, vars = {}) => {
        let str = DICTIONARY.id[key] || key;
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
          });
        }
        return str;
      },
    };
  }
  return context;
}
