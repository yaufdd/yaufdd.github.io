/** @param {string} text @returns {string[]} */
export function parseTerms(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/** @param {string} s */
const normalize = (s) => s.normalize('NFKC').toLowerCase();

/**
 * Terms present in `content`, compared case-insensitively after NFKC (so full-width letters match).
 * @param {string} content
 * @param {readonly string[]} terms
 * @returns {string[]}
 */
export function findForbidden(content, terms) {
  const haystack = normalize(content);
  return terms.filter((term) => haystack.includes(normalize(term)));
}
