import globals from 'globals';
import NetflixCommon from '@netflix/eslint-config';

export default [
  {
    ignores: ['src/vendor/**', 'stash/**'],
  },
  {
    ...NetflixCommon,
    files: ['src/**/*.js', 'demo/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  {
    ...NetflixCommon,
    files: ['server.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
