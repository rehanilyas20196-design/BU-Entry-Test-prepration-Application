module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/**', 'dist/**', '.expo/**'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'import/namespace': 'off',
    'import/no-unresolved': 'off',
  },
};
