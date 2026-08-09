import type { UserConfig } from 'vite-plus';

const oxfmtConfig = {
  printWidth: 120,
  singleQuote: true,
  jsxSingleQuote: true,
  endOfLine: 'lf',
  semi: true,
  useTabs: false,
  tabWidth: 2,
  sortTailwindcss: {
    functions: ['tv', 'cls', 'cn'],
  },
  jsdoc: true,
  sortImports: {},
  ignorePatterns: [
    'cache',
    '.cache',
    'package.json',
    'package-lock.json',
    'public',
    'CHANGELOG.md',
    '.yarn',
    'dist',
    'node_modules',
    '.next',
    'build',
    '.contentlayer',
    'src/routeTree.gen.ts',
    '.gitignore',
  ],
} satisfies NonNullable<UserConfig['fmt']>;

export default oxfmtConfig;
