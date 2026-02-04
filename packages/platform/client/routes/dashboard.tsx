import { createFileRoute, useRouter, redirect, useNavigate } from '@tanstack/react-router'
import { useLogout, apiClient } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, LogOut, User, Mail, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: async ({ location }) => {
    const user = await apiClient.auth.me()
    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
})

function DashboardPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isLoading } = useAuth()

  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        await router.invalidate()
        router.navigate({ to: '/' })
      },
      onError: (error) => {
        console.error('Logout failed:', error)
      },
    })
  }

  // Redirect if no user (shouldn't happen due to beforeLoad, but safety check)
  if (!isLoading && !user) {
    navigate({ to: '/login' })
    return null
  }

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                  <p className="text-cyan-100">Welcome back!</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Profile
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">Name</h3>
                </div>
                <p className="text-2xl font-bold text-white">{user.name}</p>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">Email</h3>
                </div>
                <p className="text-2xl font-bold text-white break-all">
                  {user.email}
                </p>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">
                    User ID
                  </h3>
                </div>
                <p className="text-sm font-mono text-gray-400 truncate" title={user.id}>
                  {user.id}
                </p>
              </div>

              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">
                    Status
                  </h3>
                </div>
                <p className="text-2xl font-bold text-green-400">Active</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-3">
                Authentication Success!
              </h3>
              <p className="text-gray-300 leading-relaxed">
                You've successfully logged in to your account. This is a
                protected route that requires authentication. The session is
                stored securely using httpOnly cookies and will expire in 30
                days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
