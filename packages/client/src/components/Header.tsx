import { A, useNavigate, useLocation } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'
import {
  Home,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  LayoutDashboard,
  User,
  Gamepad2,
} from 'lucide-solid'
import { createLogout } from '@/lib/queries'
import { createAuth } from '@/hooks/createAuth'
import { useQueryClient } from '@tanstack/solid-query'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = createSignal(false)
  const auth = createAuth()

  const logoutMutation = createLogout()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        setIsOpen(false)
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        navigate('/')
      },
      onError: (error) => {
        console.error('Logout failed:', error)
      },
    })
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header class="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div class="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 class="ml-4 text-xl font-semibold">
            <A href="/" class="hover:text-cyan-400 transition-colors">
              Milito
            </A>
          </h1>
        </div>
        <Show when={auth.user}>
          <div class="flex items-center gap-3 px-4 py-2 bg-gray-700 rounded-lg">
            <User size={20} class="text-cyan-400" />
            <span class="font-medium">{auth.user?.name}</span>
          </div>
        </Show>
      </header>

      <aside
        class={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen() ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 class="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav class="flex-1 p-4 overflow-y-auto">
          <A
            href="/"
            onClick={() => setIsOpen(false)}
            class={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
              isActive('/')
                ? 'bg-cyan-600 hover:bg-cyan-700'
                : 'hover:bg-gray-800'
            }`}
          >
            <Home size={20} />
            <span class="font-medium">Home</span>
          </A>

          <A
            href="/games"
            onClick={() => setIsOpen(false)}
            class={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
              isActive('/games')
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'hover:bg-gray-800'
            }`}
          >
            <Gamepad2 size={20} />
            <span class="font-medium">Games</span>
          </A>

          {/* Auth Links */}
          <Show
            when={auth.user}
            fallback={
              <>
                <A
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  class={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
                    isActive('/login')
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <LogIn size={20} />
                  <span class="font-medium">Login</span>
                </A>
                <A
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  class={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
                    isActive('/register')
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <UserPlus size={20} />
                  <span class="font-medium">Sign Up</span>
                </A>
              </>
            }
          >
            <A
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              class={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
                isActive('/dashboard')
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'hover:bg-gray-800'
              }`}
            >
              <LayoutDashboard size={20} />
              <span class="font-medium">Dashboard</span>
            </A>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2 w-full text-left disabled:opacity-50"
            >
              <LogOut size={20} />
              <span class="font-medium">
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </Show>
        </nav>
      </aside>
    </>
  )
}
