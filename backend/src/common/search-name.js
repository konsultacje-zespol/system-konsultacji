// name normalization for lecturer search that is resistant to Polish diacritics.
// this makes "Łukasiewicz" and "lukasiewicz" match the same searchName value.

// turns text into: lower case, no Polish diacritics, no double spaces.
export function normalizeSearchText(text) {
  return text
    .toLowerCase()
    // "ł" does not decompose via NFD (it is a separate letter, not "l" with a mark),
    // so we replace it by hand before stripping the diacritics.
    .replaceAll('ł', 'l')
    .normalize('NFD')
    // remove the combining marks NFD adds, e.g. in "ó", "ż", "ś".
    // the range ̀-ͯ is the Unicode "combining diacritical marks" block.
    .replace(/[̀-ͯ]/g, '')
    .trim()
    // collapse any run of whitespace into a single space
    .replace(/\s+/g, ' ');
}

// builds the searchName value from first and last name (last name first — that is how we search).
export function normalizeSearchName(firstName, lastName) {
  return normalizeSearchText(lastName + ' ' + firstName);
}
