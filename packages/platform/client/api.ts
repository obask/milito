import { treaty } from '@elysiajs/eden'
import type { App } from '@app/server/src/index'

export const api = treaty<App>('', {
  fetch: {
    credentials: 'include',
  },
})
