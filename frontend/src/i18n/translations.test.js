import { describe, expect, it } from 'vitest';
import pl from './pl.json';
import en from './en.json';

// collects every nested key as a dotted path, e.g. "common.role.STUDENT"
function collectKeys(object, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // recurse into nested plain objects
      keys.push(...collectKeys(value, path));
    } else {
      // record the leaf key path
      keys.push(path);
    }
  }

  return keys;
}

// verify that Polish and English translation files stay in sync
describe('i18n translations', () => {
  it('pl.json and en.json have the same keys', () => {
    // extract and sort all flattened translation keys for both languages
    const plKeys = collectKeys(pl).sort();
    const enKeys = collectKeys(en).sort();

    // find keys missing from either translation file for clear failure output
    const onlyInPl = plKeys.filter((key) => !enKeys.includes(key));
    const onlyInEn = enKeys.filter((key) => !plKeys.includes(key));

    // assert that neither file contains unmatched keys
    expect(onlyInPl, `keys only in pl.json: ${onlyInPl.join(', ')}`).toEqual([]);
    expect(onlyInEn, `keys only in en.json: ${onlyInEn.join(', ')}`).toEqual([]);
  });
});
