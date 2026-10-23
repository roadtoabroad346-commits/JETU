import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { ...jsxA11y.flatConfigs.recommended, files: ['src/**/*.tsx'] },
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/server/*',
                '@/lib/env/server',
                '@/lib/supabase/admin',
                '@/lib/supabase/server',
              ],
              message:
                'Server-only modules belong in server entrypoints; add an explicit reviewed override there.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/server/**/*.ts',
      'src/app/**/route.ts',
      'src/app/**/actions.ts',
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/proxy.ts',
      'src/lib/supabase/{server,admin}.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  globalIgnores([
    '.next/**',
    'work/**',
    'jetu/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'supabase/functions/**',
  ]),
]);
