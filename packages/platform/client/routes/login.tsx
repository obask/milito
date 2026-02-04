import { A, useNavigate } from '@solidjs/router'
import { createSignal, onMount, Show } from 'solid-js'
import { createLogin, apiClient } from '@/lib/queries'
import { useQueryClient } from '@tanstack/solid-query'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-solid'

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')

  const loginMutation = createLogin()

  // Redirect if already logged in
  onMount(async () => {
    const user = await apiClient.auth.me()
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate(
      { email: email(), password: password() },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
          navigate('/dashboard')
        },
        onError: (err) => {
          setError(err.message)
        },
      },
    )
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div class="w-full max-w-md">
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div class="flex items-center justify-center gap-3 mb-8">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
              <LogIn class="w-8 h-8 text-white" />
            </div>
            <h1 class="text-3xl font-bold text-white">Login</h1>
          </div>

          <Show when={error()}>
            <div class="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p class="text-red-200 text-sm">{error()}</p>
            </div>
          </Show>

          <form onSubmit={handleSubmit} class="space-y-6">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                  class="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                  class="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              class="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-400 text-sm">
              Don't have an account?{' '}
              <A
                href="/register"
                class="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Sign up
              </A>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
