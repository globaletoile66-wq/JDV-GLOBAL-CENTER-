import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals.js';

const nextRules = Array.isArray(nextVitals) ? nextVitals : [nextVitals];

export default defineConfig([
  ...nextRules,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]);
