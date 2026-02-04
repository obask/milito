import { useMe } from '@/lib/queries'

export function useAuth() {
  const { data: user, isLoading, error } = useMe()

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  }
}
