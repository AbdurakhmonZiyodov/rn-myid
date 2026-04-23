module.exports = {
  root: true,
  extends: ['@react-native'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['lib/', 'node_modules/', 'example/', 'scripts/'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', {allow: ['warn', 'error']}],
  },
};
