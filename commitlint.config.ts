import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'footer-max-line-length': [2, 'always', 100],
  },
  ignores: [(message: string) => message.startsWith('Merge')],
}

export default config
