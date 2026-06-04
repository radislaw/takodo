import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueI18nPlugin from '@intlify/eslint-plugin-vue-i18n'

export default tseslint.config(
  {
    ignores: [
      '**/*.d.ts',
      '**/coverage',
      '**/dist',
      '**/node_modules',
      'apps/web/src/assets',
      '.remember',
      'apps/api/prisma/migrations',
    ],
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.vue'],
    plugins: {
      '@intlify/vue-i18n': vueI18nPlugin,
    },
    settings: {
      'vue-i18n': {
        localeDir: './apps/web/src/locales/*.json',
      },
    },
    rules: {
      '@intlify/vue-i18n/no-raw-text': ['error', { ignorePattern: '^[%/]$' }],
    },
  },
  eslintConfigPrettier,
)
