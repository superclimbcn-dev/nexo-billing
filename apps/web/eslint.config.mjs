import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

const strictFiles = [
  'src/lib/reports/**/*.{ts,tsx}',
  'src/app/api/reports/**/*.{ts,tsx}',
  'src/app/(app)/informes/**/*.{ts,tsx}',
  'src/app/(app)/impuestos/page.tsx',
  'src/app/(app)/tesoreria/page.tsx',
  'src/app/sw.ts',
]

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { '@next/next': nextPlugin },
    // Initial lint adoption: existing findings remain visible without requiring
    // unrelated billing/authentication changes in this reporting feature.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'prefer-const': 'warn',
      'no-useless-escape': 'warn',
    },
  },
  {
    files: strictFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'error',
      'prefer-const': 'error',
      'no-useless-escape': 'error',
    },
  },
)
