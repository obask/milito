import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useRooms, useGame, useCreateRoom, useJoinRoom } from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import { Users, Plus, Play, Clock, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/lobby')({
  component: LobbyPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      gameId: search.gameId as string | undefined,
    }
  },
})

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

function LobbyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const search = Route.useSearch()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)

  const { data: rooms } = useRooms({
    gameId: search.gameId,
    status: 'waiting',
  })

  const { data: game } = useGame(search.gameId)

  const createRoomMutation = useCreateRoom()
  const joinRoomMutation = useJoinRoom()

  const handleCreateRoom = () => {
    if (!roomName.trim() || !search.gameId) return

    createRoomMutation.mutate(
      {
        gameId: search.gameId,
        name: roomName.trim(),
        maxPlayers,
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false)
          setRoomName('')
          navigate({ to: `/room/$roomId`, params: { roomId: data.roomId } })
        },
      },
    )
  }

  const handleJoinRoom = (roomId: string) => {
    joinRoomMutation.mutate(
      { roomId },
      {
        onSuccess: () => {
          navigate({ to: `/room/$roomId`, params: { roomId } })
        },
      },
    )
  }

  const roomList = rooms as Room[] | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Games
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {game ? `${game.name} Lobby` : 'Game Lobby'}
                </h1>
                <p className="text-gray-400">Join a room or create your own</p>
              </div>
            </div>

            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
              >
                <Plus size={20} />
                Create Room
              </button>
            )}
          </div>
        </div>

        {/* Rooms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomList?.map((room) => (
            <div
              key={room.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {room.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-2xl">{room.gameImage}</span>
                    <span>{room.gameName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-lg">
                  <Users size={16} className="text-cyan-400" />
                  <span className="text-cyan-400 font-semibold">
                    {room.playerCount}/{room.maxPlayers}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} />
                  <span>
                    {new Date(room.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={
                    !user ||
                    room.playerCount >= room.maxPlayers ||
                    joinRoomMutation.isPending
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  <Play size={16} />
                  {joinRoomMutation.isPending ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {(!roomList || roomList.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No active rooms. Create one to start playing!
            </p>
          </div>
        )}

        {!user && (
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-center">
            <p className="text-yellow-200 mb-4">
              You need to be logged in to create or join rooms
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Create Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="My Awesome Game"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={6}>6 Players</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!roomName.trim() || createRoomMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  {createRoomMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
