import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useRoom,
  useGameState,
  useStartGame,
  useInitializeGame,
  useFlipCard,
  useResetFlipped,
  useLeaveRoom,
  useMe,
  useMilitoState,
  useInitializeMilito,
  useMilitoSelectCard,
  useMilitoSelectColumn,
  useMilitoDiscard,
} from '@/lib/queries'
import { MilitoGame } from '@/components/milito'
import { Users, Trophy, ArrowLeft, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { MilitoGameState, MilitoPlayerState } from '@app/shared'

export const Route = createFileRoute('/room/$roomId')({
  component: GameRoom,
})

interface MemoryCard {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryMatchState {
  cards: MemoryCard[]
  flippedIndices: number[]
  matchedPairs: number
  currentPlayerPosition: number
  scores: { [position: number]: number }
}

interface Player {
  id: string
  userId: string
  position: number
  score: number
}

interface RoomData {
  id: string
  name: string
  gameId: string
  hostId: string
  status: 'waiting' | 'playing' | 'finished'
  maxPlayers: number
  players: Player[]
}

interface GameData {
  room: unknown
  state: MemoryMatchState
  players: Player[]
  currentPlayerPosition: number
}

interface MilitoData {
  room: unknown
  gameState: MilitoGameState
  myState: MilitoPlayerState
  players: Player[]
  isMyTurn: boolean
}

function GameRoom() {
  const { roomId } = Route.useParams()
  const navigate = useNavigate()
  const [autoResetTimer, setAutoResetTimer] = useState<number | null>(null)

  const { data: user } = useMe()
  const { data: roomData, refetch } = useRoom(roomId)

  const room = roomData as RoomData | undefined
  const isMilito = room?.gameId === 'milito'

  // Memory Match state
  const { data: gameData, refetch: refetchGame } = useGameState(
    roomId,
    room?.status === 'playing' && !isMilito,
  )
  const game = gameData as GameData | undefined

  // Milito state
  const { data: militoData, refetch: refetchMilito } = useMilitoState(
    roomId,
    room?.status === 'playing' && isMilito,
  )
  const milito = militoData as MilitoData | undefined

  const startGameMutation = useStartGame()
  const initGameMutation = useInitializeGame()
  const flipCardMutation = useFlipCard()
  const resetFlippedMutation = useResetFlipped()
  const leaveRoomMutation = useLeaveRoom()

  // Milito mutations
  const initMilitoMutation = useInitializeMilito()
  const selectCardMutation = useMilitoSelectCard()
  const selectColumnMutation = useMilitoSelectColumn()
  const discardMutation = useMilitoDiscard()

  const handleStartGame = async () => {
    await startGameMutation.mutateAsync({ roomId })
    await refetch()

    if (isMilito) {
      await initMilitoMutation.mutateAsync({ roomId })
      await refetchMilito()
    } else {
      await initGameMutation.mutateAsync({ roomId })
      await refetchGame()
    }
  }

  // Auto-reset flipped cards after 2 seconds if no match (Memory Match)
  useEffect(() => {
    if (!game?.state || isMilito) return

    const { flippedIndices, cards } = game.state

    if (flippedIndices.length === 2) {
      const [idx1, idx2] = flippedIndices
      const card1 = cards[idx1]
      const card2 = cards[idx2]

      if (card1.value !== card2.value) {
        const timer = window.setTimeout(() => {
          resetFlippedMutation.mutate({ roomId })
        }, 2000)

        setAutoResetTimer(timer)
      } else {
        setTimeout(() => {
          refetchGame()
        }, 500)
      }
    }

    return () => {
      if (autoResetTimer) {
        clearTimeout(autoResetTimer)
      }
    }
  }, [game?.state?.flippedIndices])

  const handleCardClick = (cardId: number) => {
    if (!game) return

    const { flippedIndices, currentPlayerPosition } = game.state

    if (currentPlayerPosition !== game.currentPlayerPosition) {
      return
    }

    if (flippedIndices.length >= 2) {
      return
    }

    flipCardMutation.mutate({ roomId, cardId })
  }

  const handleLeaveRoom = () => {
    leaveRoomMutation.mutate(
      { roomId },
      {
        onSuccess: () => {
          navigate({ to: '/lobby' })
        },
      },
    )
  }

  // Milito handlers
  const handleMilitoSelectCard = (cardIndex: number) => {
    selectCardMutation.mutate({ roomId, cardIndex })
  }

  const handleMilitoSelectColumn = (columnIndex: number) => {
    selectColumnMutation.mutate({ roomId, columnIndex })
  }

  const handleMilitoDiscard = (cardIndex: number) => {
    discardMutation.mutate({ roomId, cardIndex })
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    )
  }

  const isHost = room.hostId === user?.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Leave Room
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {room.name}
              </h1>
              <p className="text-gray-400">
                {room.status === 'waiting' && 'Waiting for players...'}
                {room.status === 'playing' && 'Game in progress'}
                {room.status === 'finished' && 'Game finished!'}
              </p>
            </div>

            {room.status === 'waiting' && isHost && (
              <button
                onClick={handleStartGame}
                disabled={startGameMutation.isPending || initMilitoMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                <Play size={20} />
                {startGameMutation.isPending ? 'Starting...' : 'Start Game'}
              </button>
            )}
          </div>
        </div>

        {/* Players (for non-Milito games or waiting) */}
        {(!isMilito || room.status !== 'playing') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Players</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {room.players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-4 ${
                    game &&
                    game.state.currentPlayerPosition === player.position
                      ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Player {idx + 1}</p>
                      {game && (
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy size={16} className="text-yellow-400" />
                          <span className="text-yellow-400 font-bold">
                            {game.state.scores[player.position] || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milito Game */}
        {room.status === 'playing' && isMilito && milito && (
          <MilitoGame
            gameState={milito.gameState}
            myState={milito.myState}
            isMyTurn={milito.isMyTurn}
            onSelectCard={handleMilitoSelectCard}
            onSelectColumn={handleMilitoSelectColumn}
            onDiscard={handleMilitoDiscard}
          />
        )}

        {/* Memory Match Game Board */}
        {room.status === 'playing' && !isMilito && game && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Memory Match</h2>

            {/* Current Turn Indicator */}
            <div className="mb-4 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-xl">
              <p className="text-cyan-200 text-center">
                {game.state.currentPlayerPosition ===
                game.currentPlayerPosition
                  ? "It's your turn!"
                  : `Player ${game.state.currentPlayerPosition + 1}'s turn`}
              </p>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {game.state.cards.map((card: MemoryCard) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={
                    card.isMatched ||
                    card.isFlipped ||
                    game.state.flippedIndices.length >= 2 ||
                    game.state.currentPlayerPosition !==
                      game.currentPlayerPosition
                  }
                  className={`aspect-square rounded-xl text-4xl font-bold transition-all transform ${
                    card.isMatched
                      ? 'bg-green-500/20 border-green-500 scale-95'
                      : card.isFlipped
                        ? 'bg-cyan-500 border-cyan-400 scale-105'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:scale-105'
                  } border-2 flex items-center justify-center disabled:cursor-not-allowed`}
                >
                  {card.isFlipped || card.isMatched ? card.value : '?'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Complete */}
        {room.status === 'finished' && game && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Game Complete!
            </h3>
            <p className="text-gray-300">
              Winner: Player{' '}
              {Number(Object.entries(game.state.scores).reduce((a, b) =>
                b[1] > a[1] ? b : a,
              )[0]) + 1}
            </p>
          </div>
        )}

        {/* Waiting Room */}
        {room.status === 'waiting' && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              Waiting for the host to start the game...
            </p>
            <p className="text-gray-500 text-sm">
              {room.players.length} / {room.maxPlayers} players joined
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
