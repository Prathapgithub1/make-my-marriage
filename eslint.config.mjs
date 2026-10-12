import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/.parcel-cache/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/api/src/**/*.ts', 'apps/api/tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/**/*.cjs'],
    languageOptions: { globals: globals.node },
  },
);
