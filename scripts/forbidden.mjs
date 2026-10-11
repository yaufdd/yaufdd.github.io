/** @param {string} text @returns {string[]} */
export function parseTerms(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * Comparison form: NFKC (full-width → ASCII), lower case, and no punctuation or whitespace,
 * so "Example Corp", "example-corp", "example_corp" and a line-wrapped "example\ncorp" all collapse to "examplecorp".
 * @param {string} s
 */
export const skeleton = (s) => s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]+/gu, '');

/**
 * Terms present in `content`. Matching runs on the skeleton of the text and of the text with HTML tags removed,
 * so a term split by inline markup (`example <b>corp</b>`) is still found.
 * @param {string} content
 * @param {readonly string[]} terms
 * @returns {string[]}
 */
export function findForbidden(content, terms) {
  const variants = [skeleton(content), skeleton(content.replace(/<[^>]*>/g, ''))];
  return terms.filter((term) => {
    const needle = skeleton(term);
    return needle !== '' && variants.some((v) => v.includes(needle));
  });
}

/**
 * Same as findForbidden for raw bytes of any file type (including image metadata), decoded several ways.
 * @param {Buffer} bytes
 * @param {readonly string[]} terms
 * @returns {string[]}
 */
export function findForbiddenInBuffer(bytes, terms) {
  // UTF-16 text can start at an odd offset inside a binary file, so decode it at both alignments.
  // Both are decoded from fresh even-length copies: decoding UTF-16 from memory at an odd address crashes
  // Node 24 on Windows (heap corruption) for larger inputs, and callers may pass slices of a bigger buffer.
  const utf16At = (start) => Buffer.from(bytes.subarray(start, start + ((bytes.length - start) & ~1))).toString('utf16le');
  const decodings = [bytes.toString('utf8'), bytes.toString('latin1'), utf16At(0), utf16At(1)];
  const found = new Set(decodings.flatMap((text) => findForbidden(text, terms)));
  return terms.filter((term) => found.has(term));
}
