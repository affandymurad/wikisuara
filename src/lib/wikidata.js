/**
 * Wikidata language search & QID lookup with local cache.
 * Only language-related entities are returned (languages, dialects, language families
 * and anything carrying an ISO 639 / Glottolog code), so places, people, etc. never show up.
 */
const CACHE_KEY = 'ws_wikidata_lang_cache_v2';
const API = 'https://www.wikidata.org/w/api.php';

// P31 (instance of) classes that count as language-related
const LANGUAGE_CLASSES = [
  'Q34770', // language
  'Q33742', // natural language
  'Q1288568', // modern language
  'Q436240', // ancient language
  'Q45762', // dead language
  'Q38058796', // extinct language
  'Q25295', // language family
  'Q17376908', // languoid
  'Q33384', // dialect
];
// Language identifier properties: ISO 639-1/-2/-3 and Glottolog
const LANGUAGE_CODE_PROPS = ['P218', 'P219', 'P220', 'P1394'];

const STATEMENT_FILTER =
  'haswbstatement:' + [...LANGUAGE_CLASSES.map((q) => `P31=${q}`), ...LANGUAGE_CODE_PROPS].join('|');

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

async function getJson(params) {
  const response = await fetch(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function claimValues(claims, prop) {
  return (claims?.[prop] || [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter(Boolean);
}

/**
 * Search Wikidata for a language item
 * @param {string} query
 * @param {string} lang UI language for label preference ('id' or 'en')
 */
export async function searchWikidataLanguage(query, lang = 'id') {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cache = getCache();
  const cacheKey = `${lang}:${trimmed.toLowerCase()}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    // 1. Full-text search restricted to language-related statements
    const search = await getJson({
      action: 'query',
      list: 'search',
      srnamespace: '0',
      srlimit: '20',
      srsearch: `${trimmed} ${STATEMENT_FILTER}`,
    });
    const ids = (search.query?.search || []).map((r) => r.title);
    if (ids.length === 0) return [];

    // 2. Labels, descriptions and claims for display + a second, strict check
    const uiLang = lang === 'id' ? 'id' : 'en';
    const entityData = await getJson({
      action: 'wbgetentities',
      ids: ids.join('|'),
      props: 'labels|descriptions|claims',
      languages: uiLang === 'id' ? 'id|en' : 'en',
    });

    const results = ids
      .map((qid) => {
        const entity = entityData.entities?.[qid];
        if (!entity || entity.missing !== undefined) return null;
        const claims = entity.claims;
        const classes = claimValues(claims, 'P31').map((v) => v.id);
        const isLanguageClass = classes.some((c) => LANGUAGE_CLASSES.includes(c));
        const hasLanguageCode = LANGUAGE_CODE_PROPS.some((p) => claims?.[p]?.length);
        if (!isLanguageClass && !hasLanguageCode) return null;

        const label = entity.labels?.[uiLang]?.value || entity.labels?.en?.value || qid;
        const description = entity.descriptions?.[uiLang]?.value || entity.descriptions?.en?.value || '';
        // P218: ISO 639-1 (2-letter), P220: ISO 639-3 (3-letter), P219: ISO 639-2
        const code = claimValues(claims, 'P218')[0] || claimValues(claims, 'P220')[0] || claimValues(claims, 'P219')[0] || '';
        return { qid, label, description, code };
      })
      .filter(Boolean)
      .slice(0, 8);

    cache[cacheKey] = results;
    saveCache(cache);
    return results;
  } catch (error) {
    console.warn('Wikidata search failed:', error);
    return [];
  }
}
