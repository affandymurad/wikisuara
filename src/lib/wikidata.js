/**
 * Wikidata language search & QID lookup with local cache
 */
const CACHE_KEY = 'ws_wikidata_lang_cache';

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
    const params = new URLSearchParams({
      action: 'wbsearchentities',
      format: 'json',
      language: lang === 'id' ? 'id' : 'en',
      uselang: lang === 'id' ? 'id' : 'en',
      type: 'item',
      limit: '7',
      search: trimmed,
      origin: '*',
    });

    const response = await fetch(`https://www.wikidata.org/w/api.php?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const results = (data.search || []).map((item) => ({
      qid: item.id,
      label: item.label || item.id,
      description: item.description || '',
      match: item.match,
    }));

    // If results found, also try to fetch ISO code (P218 or P220) for the top items
    if (results.length > 0) {
      const topIds = results.slice(0, 5).map((r) => r.qid).join('|');
      try {
        const entityParams = new URLSearchParams({
          action: 'wbgetentities',
          ids: topIds,
          props: 'claims',
          format: 'json',
          origin: '*',
        });
        const entityRes = await fetch(`https://www.wikidata.org/w/api.php?${entityParams.toString()}`);
        if (entityRes.ok) {
          const entityData = await entityRes.json();
          results.forEach((r) => {
            const claims = entityData.entities?.[r.qid]?.claims;
            // P218: ISO 639-1 (2-letter), P220: ISO 639-3 (3-letter)
            const p218 = claims?.P218?.[0]?.mainsnak?.datavalue?.value;
            const p220 = claims?.P220?.[0]?.mainsnak?.datavalue?.value;
            r.code = p218 || p220 || '';
          });
        }
      } catch {
        // Fallback: keep code empty for manual filling
      }
    }

    cache[cacheKey] = results;
    saveCache(cache);
    return results;
  } catch (error) {
    console.warn('Wikidata search failed:', error);
    return [];
  }
}
