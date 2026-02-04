import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import { createGames } from '@/lib/queries'
import { Gamepad2, Users, ArrowRight } from 'lucide-solid'

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  imageUrl: string | null
}

export default function GamesGallery() {
  const gamesQuery = createGames()

  const games = () => gamesQuery.data as Game[] | undefined

  return (
    <Show
      when={!gamesQuery.isLoading}
      fallback={
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div class="text-white text-xl">Loading games...</div>
        </div>
      }
    >
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div class="max-w-7xl mx-auto pt-8">
          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                <Gamepad2 class="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 class="text-4xl font-bold text-white">Game Gallery</h1>
                <p class="text-gray-400">Choose a game to play with friends</p>
              </div>
            </div>

            <A
              href="/lobby"
              class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              <Users size={20} />
              View Active Games
              <ArrowRight size={16} />
            </A>
          </div>

          {/* Games Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <For each={games()}>
              {(game) => (
                <A
                  href={`/lobby?gameId=${game.id}`}
                  class="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer"
                >
                  <div class="flex flex-col h-full">
                    {/* Game Icon */}
                    <div class="text-6xl mb-4 text-center">{game.imageUrl}</div>

                    {/* Game Info */}
                    <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {game.name}
                    </h3>

                    <p class="text-gray-400 mb-4 flex-grow">{game.description}</p>

                    {/* Players Info */}
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={16} />
                      <span>
                        {game.minPlayers === game.maxPlayers
                          ? `${game.minPlayers} players`
                          : `${game.minPlayers}-${game.maxPlayers} players`}
                      </span>
                    </div>

                    {/* Play Button */}
                    <div class="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold group-hover:from-purple-600 group-hover:to-pink-600 transition-all">
                      Play Now
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </A>
              )}
            </For>
          </div>

          <Show when={!games() || games()!.length === 0}>
            <div class="text-center py-12">
              <p class="text-gray-400 text-lg">No games available yet</p>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
