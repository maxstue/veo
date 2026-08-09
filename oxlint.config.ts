import type { UserConfig } from 'vite-plus';

const oxlintConfig = {
  categories: {
    correctness: 'warn',
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    '**/build/**',
    '**/coverage/**',
    '**/dist/**',
    '**/snap/**',
    '**/.vscode/**',
    '**/public/**',
    '**/config/**',
    '**/dev-dist/**',
    'src/routeTree.gen.ts',
  ],
  jsPlugins: [
    { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
    { name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' },
    { name: 'eslint-tanstack-router', specifier: '@tanstack/eslint-plugin-router' },
  ],
  plugins: ['typescript', 'eslint', 'jsdoc', 'react', 'react-perf'],
  rules: {
    'eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'typescript/array-type': ['warn', { default: 'array-simple' }],
    'typescript/explicit-function-return-type': 'off',
    'typescript/no-floating-promises': 'off',
    'typescript/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
    'react-hooks-js/component-hook-factories': 'error',
    'react-hooks-js/config': 'error',
    'react-hooks-js/error-boundaries': 'error',
    'react-hooks-js/gating': 'error',
    'react-hooks-js/globals': 'error',
    'react-hooks-js/immutability': 'error',
    'react-hooks-js/incompatible-library': 'warn',
    'react-hooks-js/preserve-manual-memoization': 'error',
    'react-hooks-js/purity': 'error',
    'react-hooks-js/refs': 'error',
    'react-hooks-js/set-state-in-effect': 'warn',
    'react-hooks-js/set-state-in-render': 'error',
    'react-hooks-js/static-components': 'error',
    'react-hooks-js/unsupported-syntax': 'error',
    'react-hooks-js/use-memo': 'error',
    'react-hooks-js/void-use-memo': 'error',
    'react-hooks-js/capitalized-calls': 'off',
    'react-hooks-js/fbt': 'off',
    'react-hooks-js/hooks': 'off',
    'react-hooks-js/invariant': 'off',
    'react-hooks-js/memoized-effect-dependencies': 'off',
    'react-hooks-js/no-deriving-state-in-effects': 'off',
    'react-hooks-js/rule-suppression': 'off',
    'react-hooks-js/syntax': 'off',
    'react-hooks-js/todo': 'off',
    'eslint-tanstack-router/create-route-property-order': 'error',
    'vite-plus/prefer-vite-plus-imports': 'error',
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
} satisfies NonNullable<UserConfig['lint']>;

export default oxlintConfig;
