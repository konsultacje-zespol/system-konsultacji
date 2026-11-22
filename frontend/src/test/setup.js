import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../i18n/i18n.js';

// runs before every test file:
// - jest-dom adds checks such as expect(element).toBeInTheDocument()
// - i18n is started like in main.jsx, so components show real Polish texts

// remove the rendered component after each test, so the next test starts with an empty page
afterEach(() => {
  cleanup();
});
