import { useNavigate, useParams } from '@solidjs/router'
import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js'
import {
  createRoom,
  createGameState,
  createStartGame,
  createInitializeGame,
  createFlipCard,
  createResetFlipped,
  createLeaveRoom,
  createMe,
  createMilitoState,
  createInitializeMilito,
  createMilitoSelectCard,
  createMilitoSelectColumn,
  createMilitoDiscard,
} from '@/lib/queries'
import { MilitoGame } from '@/components/milito'
import { Users, Trophy, ArrowLeft, Play } from 'lucide-solid'
import type { MilitoGameState, MilitoPlayerState } from '@app/shared'

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

export default function GameRoom() {
  const params = useParams()
  const navigate = useNavigate()
  const [autoResetTimer, setAutoResetTimer] = createSignal<number | null>(null)

  const userQuery = createMe()
  const roomQuery = createRoom(() => params.roomId)

  const room = () => roomQuery.data as RoomData | undefined
  const isMilito = () => room()?.gameId === 'milito'

  // Memory Match state
  const gameQuery = createGameState(
    () => params.roomId,
    () => room()?.status === 'playing' && !isMilito(),
  )
  const game = () => gameQuery.data as GameData | undefined

  // Milito state
  const militoQuery = createMilitoState(
    () => params.roomId,
    () => room()?.status === 'playing' && isMilito(),
  )
  const milito = () => militoQuery.data as MilitoData | undefined

  const startGameMutation = createStartGame()
  const initGameMutation = createInitializeGame()
  const flipCardMutation = createFlipCard()
  const resetFlippedMutation = createResetFlipped()
  const leaveRoomMutation = createLeaveRoom()

  // Milito mutations
  const initMilitoMutation = createInitializeMilito()
  const selectCardMutation = createMilitoSelectCard()
  const selectColumnMutation = createMilitoSelectColumn()
  const discardMutation = createMilitoDiscard()

  const handleStartGame = async () => {
    await startGameMutation.mutateAsync({ roomId: params.roomId })
    await roomQuery.refetch()

    if (isMilito()) {
      await initMilitoMutation.mutateAsync({ roomId: params.roomId })
      await militoQuery.refetch()
    } else {
      await initGameMutation.mutateAsync({ roomId: params.roomId })
      await gameQuery.refetch()
    }
  }

  // Auto-reset flipped cards after 2 seconds if no match (Memory Match)
  createEffect(() => {
    const g = game()
    if (!g?.state || isMilito()) return

    const { flippedIndices, cards } = g.state

    if (flippedIndices.length === 2) {
      const [idx1, idx2] = flippedIndices
      const card1 = cards[idx1]
      const card2 = cards[idx2]

      if (card1.value !== card2.value) {
        const timer = window.setTimeout(() => {
          resetFlippedMutation.mutate({ roomId: params.roomId })
        }, 2000)

        setAutoResetTimer(timer)
      } else {
        setTimeout(() => {
          gameQuery.refetch()
        }, 500)
      }
    }
  })

  onCleanup(() => {
    const timer = autoResetTimer()
    if (timer) {
      clearTimeout(timer)
    }
  })

  const handleCardClick = (cardId: number) => {
    const g = game()
    if (!g) return

    const { flippedIndices, currentPlayerPosition } = g.state

    if (currentPlayerPosition !== g.currentPlayerPosition) {
      return
    }

    if (flippedIndices.length >= 2) {
      return
    }

    flipCardMutation.mutate({ roomId: params.roomId, cardId })
  }

  const handleLeaveRoom = () => {
    leaveRoomMutation.mutate(
      { roomId: params.roomId },
      {
        onSuccess: () => {
          navigate('/lobby')
        },
      },
    )
  }

  // Milito handlers
  const handleMilitoSelectCard = (cardIndex: number) => {
    selectCardMutation.mutate({ roomId: params.roomId, cardIndex })
  }

  const handleMilitoSelectColumn = (columnIndex: number) => {
    selectColumnMutation.mutate({ roomId: params.roomId, columnIndex })
  }

  const handleMilitoDiscard = (cardIndex: number) => {
    discardMutation.mutate({ roomId: params.roomId, cardIndex })
  }

  const isHost = () => room()?.hostId === userQuery.data?.id

  return (
    <Show
      when={room()}
      fallback={
        <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div class="text-white text-xl">Loading room...</div>
        </div>
      }
    >
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div class="max-w-7xl mx-auto pt-8">
          {/* Header */}
          <div class="mb-8">
            <button
              onClick={handleLeaveRoom}
              class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Leave Room
            </button>

            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-4xl font-bold text-white mb-2">
                  {room()!.name}
                </h1>
                <p class="text-gray-400">
                  {room()!.status === 'waiting' && 'Waiting for players...'}
                  {room()!.status === 'playing' && 'Game in progress'}
                  {room()!.status === 'finished' && 'Game finished!'}
                </p>
              </div>

              <Show when={room()!.status === 'waiting' && isHost()}>
                <button
                  onClick={handleStartGame}
                  disabled={startGameMutation.isPending || initMilitoMutation.isPending}
                  class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  <Play size={20} />
                  {startGameMutation.isPending ? 'Starting...' : 'Start Game'}
                </button>
              </Show>
            </div>
          </div>

          {/* Players (for non-Milito games or waiting) */}
          <Show when={!isMilito() || room()!.status !== 'playing'}>
            <div class="mb-8">
              <h2 class="text-2xl font-bold text-white mb-4">Players</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <For each={room()!.players}>
                  {(player, idx) => (
                    <div
                      class={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-4 ${
                        game() &&
                        game()!.state.currentPlayerPosition === player.position
                          ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                          : 'border-slate-700'
                      }`}
                    >
                      <div class="flex items-center gap-3">
                        <Users size={20} class="text-cyan-400" />
                        <div>
                          <p class="text-white font-semibold">Player {idx() + 1}</p>
                          <Show when={game()}>
                            <div class="flex items-center gap-2 mt-1">
                              <Trophy size={16} class="text-yellow-400" />
                              <span class="text-yellow-400 font-bold">
                                {game()!.state.scores[player.position] || 0}
                              </span>
                            </div>
                          </Show>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Milito Game */}
          <Show when={room()!.status === 'playing' && isMilito() && milito()}>
            <MilitoGame
              gameState={milito()!.gameState}
              myState={milito()!.myState}
              isMyTurn={milito()!.isMyTurn}
              onSelectCard={handleMilitoSelectCard}
              onSelectColumn={handleMilitoSelectColumn}
              onDiscard={handleMilitoDiscard}
            />
          </Show>

          {/* Memory Match Game Board */}
          <Show when={room()!.status === 'playing' && !isMilito() && game()}>
            <div>
              <h2 class="text-2xl font-bold text-white mb-4">Memory Match</h2>

              {/* Current Turn Indicator */}
              <div class="mb-4 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-xl">
                <p class="text-cyan-200 text-center">
                  {game()!.state.currentPlayerPosition ===
                  game()!.currentPlayerPosition
                    ? "It's your turn!"
                    : `Player ${game()!.state.currentPlayerPosition + 1}'s turn`}
                </p>
              </div>

              {/* Card Grid */}
              <div class="grid grid-cols-4 md:grid-cols-6 gap-4">
                <For each={game()!.state.cards}>
                  {(card) => (
                    <button
                      onClick={() => handleCardClick(card.id)}
                      disabled={
                        card.isMatched ||
                        card.isFlipped ||
                        game()!.state.flippedIndices.length >= 2 ||
                        game()!.state.currentPlayerPosition !==
                          game()!.currentPlayerPosition
                      }
                      class={`aspect-square rounded-xl text-4xl font-bold transition-all transform ${
                        card.isMatched
                          ? 'bg-green-500/20 border-green-500 scale-95'
                          : card.isFlipped
                            ? 'bg-cyan-500 border-cyan-400 scale-105'
                            : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:scale-105'
                      } border-2 flex items-center justify-center disabled:cursor-not-allowed`}
                    >
                      {card.isFlipped || card.isMatched ? card.value : '?'}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Game Complete */}
          <Show when={room()!.status === 'finished' && game()}>
            <div class="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl text-center">
              <h3 class="text-2xl font-bold text-white mb-2">
                Game Complete!
              </h3>
              <p class="text-gray-300">
                Winner: Player{' '}
                {Number(Object.entries(game()!.state.scores).reduce((a, b) =>
                  b[1] > a[1] ? b : a,
                )[0]) + 1}
              </p>
            </div>
          </Show>

          {/* Waiting Room */}
          <Show when={room()!.status === 'waiting'}>
            <div class="text-center py-12">
              <p class="text-gray-400 text-lg mb-4">
                Waiting for the host to start the game...
              </p>
              <p class="text-gray-500 text-sm">
                {room()!.players.length} / {room()!.maxPlayers} players joined
              </p>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
