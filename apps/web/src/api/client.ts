import createClient from 'openapi-fetch'

import type { paths } from '../../../../packages/contract/openapi/types.gen'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL })
