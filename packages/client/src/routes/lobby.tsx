import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { createSignal, For, Show } from 'solid-js'
import { createRooms, createGame, createCreateRoom, createJoinRoom } from '@/lib/queries'
import { createAuth } from '@/hooks/createAuth'
import { Users, Plus, Play, Clock, ArrowLeft } from 'lucide-solid'

interface Room {
  id: string
  name: string
  gameId: string
  gameName: string | null
  gameImage: string | null
  hostId: string
  status: string
  maxPlayers: number
  playerCount: number
  createdAt: Date
}

export default function LobbyPage() {
  const navigate = useNavigate()
  const auth = createAuth()
  const [searchParams] = useSearchParams()
  const [showCreateModal, setShowCreateModal] = createSignal(false)
  const [roomName, setRoomName] = createSignal('')
  const [maxPlayers, setMaxPlayers] = createSignal(4)

  const gameId = () => searchParams.gameId

  const roomsQuery = createRooms(() => ({
    gameId: gameId(),
    status: 'waiting' as const,
  }))

  const gameQuery = createGame(gameId)

  const createRoomMutation = createCreateRoom()
  const joinRoomMutation = createJoinRoom()

  const handleCreateRoom = () => {
    const gid = gameId()
    if (!roomName().trim() || !gid) return

    createRoomMutation.mutate(
      {
        gameId: gid,
        name: roomName().trim(),
        maxPlayers: maxPlayers(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false)
          setRoomName('')
          navigate(`/room/${data.roomId}`)
        },
      },
    )
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoomMutation.mutate(
      { roomId },
      {
        onSuccess: () => {
          navigate(`/room/${roomId}`)
        },
      },
    )
  }

  const rooms = () => roomsQuery.data as Room[] | undefined
  const game = () => gameQuery.data

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div class="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div class="mb-8">
          <A
            href="/games"
            class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Games
          </A>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
                <Users class="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 class="text-4xl font-bold text-white">
                  {game() ? `${game()!.name} Lobby` : 'Game Lobby'}
                </h1>
                <p class="text-gray-400">Join a room or create your own</p>
              </div>
            </div>

            <Show when={auth.user}>
              <button
                onClick={() => setShowCreateModal(true)}
                class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
              >
                <Plus size={20} />
                Create Room
              </button>
            </Show>
          </div>
        </div>

        {/* Rooms List */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <For each={rooms()}>
            {(room) => (
              <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500 transition-all">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-white mb-2">
                      {room.name}
                    </h3>
                    <div class="flex items-center gap-2 text-sm text-gray-400">
                      <span class="text-2xl">{room.gameImage}</span>
                      <span>{room.gameName}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-lg">
                    <Users size={16} class="text-cyan-400" />
                    <span class="text-cyan-400 font-semibold">
                      {room.playerCount}/{room.maxPlayers}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={16} />
                    <span>
                      {new Date(room.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={
                      !auth.user ||
                      room.playerCount >= room.maxPlayers ||
                      joinRoomMutation.isPending
                    }
                    class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                  >
                    <Play size={16} />
                    {joinRoomMutation.isPending ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={!rooms() || rooms()!.length === 0}>
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg mb-4">
              No active rooms. Create one to start playing!
            </p>
          </div>
        </Show>

        <Show when={!auth.user}>
          <div class="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-center">
            <p class="text-yellow-200 mb-4">
              You need to be logged in to create or join rooms
            </p>
            <A
              href="/login"
              class="inline-block px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              Login
            </A>
          </div>
        </Show>
      </div>

      {/* Create Room Modal */}
      <Show when={showCreateModal()}>
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h2 class="text-2xl font-bold text-white mb-4">Create Room</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName()}
                  onInput={(e) => setRoomName(e.currentTarget.value)}
                  placeholder="My Awesome Game"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Max Players
                </label>
                <select
                  value={maxPlayers()}
                  onChange={(e) => setMaxPlayers(Number(e.currentTarget.value))}
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>

              <div class="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!roomName().trim() || createRoomMutation.isPending}
                  class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  {createRoomMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
