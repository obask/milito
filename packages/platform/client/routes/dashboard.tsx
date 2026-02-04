import { useNavigate } from '@solidjs/router'
import { onMount, Show } from 'solid-js'
import { createLogout, apiClient } from '@/lib/queries'
import { useQueryClient } from '@tanstack/solid-query'
import { LayoutDashboard, LogOut, User, Mail, Calendar } from 'lucide-solid'
import { createAuth } from '@/hooks/createAuth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = createAuth()

  const logoutMutation = createLogout()

  // Redirect if not logged in
  onMount(async () => {
    const user = await apiClient.auth.me()
    if (!user) {
      navigate('/login', { replace: true })
    }
  })

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        navigate('/')
      },
      onError: (error) => {
        console.error('Logout failed:', error)
      },
    })
  }

  return (
    <Show
      when={!auth.isLoading && auth.user}
      fallback={
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div class="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div class="max-w-4xl mx-auto pt-8">
          <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                    <LayoutDashboard class="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 class="text-3xl font-bold text-white">Dashboard</h1>
                    <p class="text-cyan-100">Welcome back!</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <LogOut class="w-5 h-5" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>

            <div class="p-8">
              <h2 class="text-2xl font-bold text-white mb-6">
                Your Profile
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
                      <User class="w-5 h-5 text-white" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-300">Name</h3>
                  </div>
                  <p class="text-2xl font-bold text-white">{auth.user?.name}</p>
                </div>

                <div class="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                      <Mail class="w-5 h-5 text-white" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-300">Email</h3>
                  </div>
                  <p class="text-2xl font-bold text-white break-all">
                    {auth.user?.email}
                  </p>
                </div>

                <div class="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                      <Calendar class="w-5 h-5 text-white" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-300">
                      User ID
                    </h3>
                  </div>
                  <p class="text-sm font-mono text-gray-400 truncate" title={auth.user?.id}>
                    {auth.user?.id}
                  </p>
                </div>

                <div class="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                      <LayoutDashboard class="w-5 h-5 text-white" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-300">
                      Status
                    </h3>
                  </div>
                  <p class="text-2xl font-bold text-green-400">Active</p>
                </div>
              </div>

              <div class="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
                <h3 class="text-xl font-semibold text-white mb-3">
                  Authentication Success!
                </h3>
                <p class="text-gray-300 leading-relaxed">
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
    </Show>
  )
}
