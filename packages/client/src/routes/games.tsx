import { createFileRoute, Link } from '@tanstack/react-router'
import { useGames } from '@/lib/queries'
import { Gamepad2, Users, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/games')({
  component: GamesGallery,
})

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  imageUrl: string | null
}

function GamesGallery() {
  const { data: games, isLoading } = useGames()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading games...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Game Gallery</h1>
              <p className="text-gray-400">Choose a game to play with friends</p>
            </div>
          </div>

          <Link
            to="/lobby"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <Users size={20} />
            View Active Games
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(games as Game[] | undefined)?.map((game) => (
            <Link
              key={game.id}
              to="/lobby"
              search={{ gameId: game.id }}
              className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="flex flex-col h-full">
                {/* Game Icon */}
                <div className="text-6xl mb-4 text-center">{game.imageUrl}</div>

                {/* Game Info */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  {game.name}
                </h3>

                <p className="text-gray-400 mb-4 flex-grow">{game.description}</p>

                {/* Players Info */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  <span>
                    {game.minPlayers === game.maxPlayers
                      ? `${game.minPlayers} players`
                      : `${game.minPlayers}-${game.maxPlayers} players`}
                  </span>
                </div>

                {/* Play Button */}
                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold group-hover:from-purple-600 group-hover:to-pink-600 transition-all">
                  Play Now
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!games || games.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No games available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
