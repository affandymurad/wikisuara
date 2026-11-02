/**
 * Default languages map and MediaWiki Babel proficiency levels for Wikisuara
 * Reference: https://www.mediawiki.org/wiki/Extension:Babel
 */

export const BABEL_LEVELS = [
  {
    code: 'N',
    label: 'xx-N',
    titleId: 'Penutur Asli (Native)',
    titleEn: 'Native speaker',
    descId: 'Penutur asli yang menggunakan bahasa ini setiap hari dan memahaminya secara mendalam, termasuk ungkapan sehari-hari dan idiom.',
    descEn: 'Native speakers who use a language every day and have a thorough grasp of it, including colloquialisms and idioms.',
    color: '#198754',
  },
  {
    code: '5',
    label: 'xx-5',
    titleId: 'Kemahiran Profesional',
    titleEn: 'Professional proficiency',
    descId: 'Mampu menjawab pertanyaan penggunaan bahasa yang mungkin diajukan oleh penutur asli.',
    descEn: 'You are able to answer language usage questions that may be asked by native speakers.',
    color: '#2d4f9c',
  },
  {
    code: '4',
    label: 'xx-4',
    titleId: 'Mendekati Penutur Asli',
    titleEn: 'Near-native',
    descId: 'Meskipun bukan bahasa pertama sejak lahir, kemampuan Anda setara dengan penutur asli.',
    descEn: 'Although not your first language from birth, your ability is like that of a native speaker.',
    color: '#5278d0',
  },
  {
    code: '3',
    label: 'xx-3',
    titleId: 'Tingkat Mahir',
    titleEn: 'Advanced level',
    descId: 'Dapat menulis dan berkomunikasi tanpa masalah, meskipun mungkin ada sedikit kesalahan.',
    descEn: 'Can write with no problem, though some small errors might occur.',
    color: '#0891b2',
  },
  {
    code: '2',
    label: 'xx-2',
    titleId: 'Tingkat Menengah',
    titleEn: 'Intermediate ability',
    descId: 'Cukup untuk menyunting atau berdiskusi.',
    descEn: 'Enough for editing or discussions.',
    color: '#b45309',
  },
  {
    code: '1',
    label: 'xx-1',
    titleId: 'Tingkat Dasar',
    titleEn: 'Basic ability',
    descId: 'Cukup untuk memahami materi tertulis atau pertanyaan sederhana.',
    descEn: 'Enough to understand written material or simple questions in this language.',
    color: '#64748b',
  },
  {
    code: '0',
    label: 'xx-0',
    titleId: 'Tidak Paham Sama Sekali',
    titleEn: 'No ability',
    descId: 'Tidak memahami bahasa ini sama sekali.',
    descEn: "Do not understand the language at all.",
    color: '#94a3b8',
  },
];
