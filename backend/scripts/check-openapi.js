import { writeFileSync } from 'node:fs';
import { openapiSpec } from '../src/docs/openapi.js';

// Building openapiSpec already fails on a broken @openapi comment (failOnErrors: true).
// The file written here is checked by Redocly in the "openapi:check" script.
writeFileSync('openapi.generated.json', JSON.stringify(openapiSpec, null, 2));
