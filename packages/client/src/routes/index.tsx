import { createFileRoute, Link } from '@tanstack/react-router'
import { Server, Shield, Zap, ArrowRight, Gamepad2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()

  const features = [
    {
      icon: <Server className="w-12 h-12 text-cyan-400" />,
      title: 'Elysia + Eden',
      description:
        'High-performance Bun-native server with type-safe API communication. Full TypeScript inference from server to client.',
    },
    {
      icon: <Shield className="w-12 h-12 text-purple-400" />,
      title: 'Secure Authentication',
      description:
        'Session-based auth with httpOnly cookies. 30-day sessions with automatic expiration and cleanup.',
    },
    {
      icon: <Zap className="w-12 h-12 text-blue-400" />,
      title: 'Modern Stack',
      description:
        'React + TanStack Router on the client. Drizzle ORM with SQLite. Independent deployment ready.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Your App
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Full-stack application with separate client and server
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Built with Elysia, Eden Treaty, React, and TanStack Router. Type-safe
            APIs, secure authentication, and independent deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/games"
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50"
            >
              <Gamepad2 size={20} />
              Play Games
              <ArrowRight size={20} />
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/50"
              >
                Dashboard
                <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-purple-500/50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Tech Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
