/** Documentary dates never activate geometry without a separate reviewed model. */
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** @param {any[]} records @param {{query?:string,topic?:string,until?:number|null}} options */
export function filterResearch(records, {query = '', topic = '', until = null} = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return records.filter(record => (!topic || record.topic === topic || record.topics?.includes(topic)) &&
    (until === null || (record.year ?? record.period?.[0] ?? Infinity) <= until) &&
    terms.every(term => normalize(JSON.stringify(record)).includes(term)));
}
export function censusAt(census, year) {
  if (!Number.isFinite(year)) throw new Error('Invalid census year');
  return [...census.rows].reverse().find(row => row.year <= year) ?? null;
}
export function inheritedContextVisible(year, showContext) { return year <= 1800 || showContext; }
export function evidenceForYear(data, year) {
  return {events: data.events.filter(e => e.year === year), census: censusAt(data.census, year),
    inheritedContext: year > 1800, range: data.range};
}
