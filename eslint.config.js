import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      // ===== STYLE =====
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],

      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],

      // ===== IMPORTS =====
      'object-curly-newline': ['error', { ImportDeclaration: 'never' }],
      'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],

      // ===== CLEAN CODE =====
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',

      // ===== TS =====
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];