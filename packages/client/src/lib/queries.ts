import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { api, type User } from './api'

// Auth queries and mutations
export function createMe() {
  return createQuery(() => ({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const data = await api.auth.me()
        return data?.user || null
      } catch {
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  }))
}

export function createLogin() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { email: string; password: string }) => api.auth.login(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

export function createRegister() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      api.auth.register(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

export function createLogout() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

// Games queries and mutations
export function createGames() {
  return createQuery(() => ({
    queryKey: ['games'],
    queryFn: () => api.games.list(),
  }))
}

export function createGame(gameId: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ['games', gameId()],
    queryFn: async () => {
      const id = gameId()
      if (!id) return null
      return api.games.get(id)
    },
    enabled: !!gameId(),
  }))
}

export function createRooms(options: () => { gameId?: string; status?: 'waiting' | 'playing' | 'finished' } | undefined) {
  return createQuery(() => ({
    queryKey: ['rooms', options()],
    queryFn: () => api.games.rooms.list(options()),
  }))
}

export function createRoom(roomId: () => string) {
  return createQuery(() => ({
    queryKey: ['rooms', roomId()],
    queryFn: () => api.games.rooms.get(roomId()),
    refetchInterval: 2000,
  }))
}

export function createCreateRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { gameId: string; name: string; maxPlayers: number }) =>
      api.games.rooms.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createJoinRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.games.rooms.join(input.roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createLeaveRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.games.rooms.leave(input.roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createStartGame() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.games.rooms.start(input.roomId),
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  }))
}

// Gameplay queries and mutations
export function createGameState(roomId: () => string, enabled: () => boolean) {
  return createQuery(() => ({
    queryKey: ['gameplay', roomId()],
    queryFn: () => api.gameplay.getState(roomId()),
    enabled: enabled(),
    refetchInterval: 1000,
  }))
}

export function createInitializeGame() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.gameplay.initialize(input.roomId),
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

export function createFlipCard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string; cardId: number }) =>
      api.gameplay.flip(input.roomId, input.cardId),
    onSuccess: (_: unknown, variables: { roomId: string; cardId: number }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

export function createResetFlipped() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.gameplay.reset(input.roomId),
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

// Milito game queries and mutations
export function createMilitoState(roomId: () => string, enabled: () => boolean) {
  return createQuery(() => ({
    queryKey: ['milito', roomId()],
    queryFn: () => api.milito.getState(roomId()),
    enabled: enabled(),
    refetchInterval: 1000,
  }))
}

export function createInitializeMilito() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string }) => api.milito.initialize(input.roomId),
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  }))
}

export function createMilitoSelectCard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string; cardIndex: number }) =>
      api.milito.selectCard(input.roomId, input.cardIndex),
    onSuccess: (_: unknown, variables: { roomId: string; cardIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

export function createMilitoSelectColumn() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string; columnIndex: number }) =>
      api.milito.selectColumn(input.roomId, input.columnIndex),
    onSuccess: (_: unknown, variables: { roomId: string; columnIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

export function createMilitoDiscard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: (input: { roomId: string; cardIndex: number }) =>
      api.milito.discard(input.roomId, input.cardIndex),
    onSuccess: (_: unknown, variables: { roomId: string; cardIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

// Standalone API client for use outside components (e.g., in route guards)
export const apiClient = {
  auth: {
    me: async (): Promise<User | null> => {
      try {
        const data = await api.auth.me()
        return data?.user || null
      } catch {
        return null
      }
    },
  },
}
