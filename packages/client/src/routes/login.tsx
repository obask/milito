import { createFileRoute, Link, useRouter, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useLogin } from '@/lib/queries'
import { apiClient } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async () => {
    const user = await apiClient.auth.me()
    if (user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    console.log('Attempting login with:', { email, password: '***' })
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: async (data) => {
          console.log('Login success:', data)
          await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
          await router.invalidate()
          router.navigate({ to: '/dashboard' })
        },
        onError: (err) => {
          console.error('Login error:', err)
          setError(err.message)
        },
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Login</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              disabled={loginMutation.isPending}
              onClick={() => {
                setError('')
                loginMutation.mutate(
                  { email: 'test@example.com', password: 'password123' },
                  {
                    onSuccess: async (data) => {
                      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
                      await router.invalidate()
                      router.navigate({ to: '/dashboard' })
                    },
                    onError: (err) => {
                      setError(err.message)
                    },
                  },
                )
              }}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium rounded-lg border border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Login as test user
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
