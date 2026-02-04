import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
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
} from 'lucide-react'
import { useLogout } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'

export default function Header() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: async () => {
        setIsOpen(false)
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        await router.invalidate()
        router.navigate({ to: '/' })
      },
      onError: (error) => {
        console.error('Logout failed:', error)
      },
    })
  }

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">
              App
            </Link>
          </h1>
        </div>
        {user && (
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-700 rounded-lg">
            <User size={20} className="text-cyan-400" />
            <span className="font-medium">{user.name}</span>
          </div>
        )}
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/games"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors mb-2',
            }}
          >
            <Gamepad2 size={20} />
            <span className="font-medium">Games</span>
          </Link>

          {/* Auth Links */}
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors mb-2',
                }}
              >
                <LayoutDashboard size={20} />
                <span className="font-medium">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2 w-full text-left disabled:opacity-50"
              >
                <LogOut size={20} />
                <span className="font-medium">
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                }}
              >
                <LogIn size={20} />
                <span className="font-medium">Login</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors mb-2',
                }}
              >
                <UserPlus size={20} />
                <span className="font-medium">Sign Up</span>
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>
  )
}
