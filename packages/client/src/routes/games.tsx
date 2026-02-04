import { createFileRoute, Link } from '@tanstack/react-router'
import { Swords, Users, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/games')({
  component: MilitoLanding,
})

function MilitoLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-red-500 p-4 rounded-2xl mb-6">
            <Swords className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Milito</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Ancient tactical card game. Deploy units on a 5-column battlefield to conquer territory!
          </p>
        </div>

        {/* Game Card */}
        <Link
          to="/lobby"
          search={{ gameId: 'milito' }}
          className="group block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-amber-500 transition-all hover:scale-[1.02] cursor-pointer max-w-xl mx-auto"
        >
          <div className="flex flex-col items-center">
            <div className="text-8xl mb-6">⚔️</div>

            <div className="flex items-center gap-2 text-gray-400 mb-6">
              <Users size={20} />
              <span className="text-lg">2 players</span>
            </div>

            <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg text-white font-semibold text-lg group-hover:from-amber-600 group-hover:to-red-600 transition-all">
              Play Now
              <ArrowRight size={20} />
            </div>
          </div>
        </Link>

        {/* View Active Rooms */}
        <div className="text-center mt-8">
          <Link
            to="/lobby"
            search={{ gameId: 'milito' }}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Users size={18} />
            View Active Rooms
          </Link>
        </div>
      </div>
    </div>
  )
}
