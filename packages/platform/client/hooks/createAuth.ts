import { createMe } from '@/lib/queries'

export function createAuth() {
  const query = createMe()

  return {
    get user() {
      return query.data || null
    },
    get isLoading() {
      return query.isLoading
    },
    get isAuthenticated() {
      return !!query.data
    },
    get error() {
      return query.error
    },
  }
}
