import { describe, it, expect } from 'vitest';
import { normalizeSearchName, normalizeSearchText } from './search-name.js';

describe('normalizeSearchText', () => {
  it('removes upper case, Polish diacritics and extra spaces', () => {
    expect(normalizeSearchText('  ŁUKA ')).toBe('luka');
  });

  it('normalizes every Polish diacritic (ą ć ę ł ń ó ś ź ż)', () => {
    expect(normalizeSearchText('Zażółć gęślą jaźń')).toBe('zazolc gesla jazn');
  });
});

describe('normalizeSearchName', () => {
  it('replaces "ł" with "l" and puts the last name before the first name', () => {
    expect(normalizeSearchName('Ewa', 'Łukasiewicz')).toBe('lukasiewicz ewa');
  });

  it('strips marks from "ż" and "ó"', () => {
    expect(normalizeSearchName('Marek', 'Żółkiewski')).toBe('zolkiewski marek');
  });

  it('collapses extra spaces into single spaces', () => {
    expect(normalizeSearchName('  Jan  ', '  Kowalski  ')).toBe('kowalski jan');
  });
});
