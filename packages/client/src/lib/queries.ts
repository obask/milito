import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { api } from './api'

// Helper to extract error message from Eden response
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value: unknown }).value
    if (value && typeof value === 'object' && 'message' in value) {
      return String((value as { message: unknown }).message)
    }
  }
  return 'An error occurred'
}

// Auth queries and mutations using Better-Auth native endpoints
export function createMe() {
  return createQuery(() => ({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/get-session', {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json()
      return data?.user || null
    },
    retry: false,
    refetchOnWindowFocus: false,
  }))
}

export function createLogin() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Login failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

export function createRegister() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { email: string; password: string; name: string }) => {
      const res = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Registration failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

export function createLogout() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async () => {
      const res = await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Logout failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  }))
}

// Games queries and mutations
export function createGames() {
  return createQuery(() => ({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch games')
      return res.json()
    },
  }))
}

export function createGame(gameId: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ['games', gameId()],
    queryFn: async () => {
      const id = gameId()
      if (!id) return null
      const { data, error } = await api.api.games({ gameId: id }).get()
      if (error) throw error
      if (data && 'error' in data) return null
      return data
    },
    enabled: !!gameId(),
  }))
}

export function createRooms(options: () => { gameId?: string; status?: 'waiting' | 'playing' | 'finished' } | undefined) {
  return createQuery(() => ({
    queryKey: ['rooms', options()],
    queryFn: async () => {
      const opts = options()
      const params = new URLSearchParams()
      if (opts?.gameId) params.set('gameId', opts.gameId)
      if (opts?.status) params.set('status', opts.status)
      const url = `/api/games/rooms${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    },
  }))
}

export function createRoom(roomId: () => string) {
  return createQuery(() => ({
    queryKey: ['rooms', roomId()],
    queryFn: async () => {
      const { data, error } = await api.api.games.rooms({ roomId: roomId() }).get()
      if (error) throw error
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    refetchInterval: 2000,
  }))
}

export function createCreateRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { gameId: string; name: string; maxPlayers: number }) => {
      const res = await fetch('/api/games/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create room')
      return data as { roomId: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createJoinRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const { data, error } = await api.api.games.rooms({ roomId: input.roomId }).join.post()
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createLeaveRoom() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const { data, error } = await api.api.games.rooms({ roomId: input.roomId }).leave.post()
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  }))
}

export function createStartGame() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const { data, error } = await api.api.games.rooms({ roomId: input.roomId }).start.post()
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  }))
}

// Gameplay queries and mutations
export function createGameState(roomId: () => string, enabled: () => boolean) {
  return createQuery(() => ({
    queryKey: ['gameplay', roomId()],
    queryFn: async () => {
      const { data, error } = await api.api.gameplay({ roomId: roomId() }).state.get()
      if (error) throw error
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    enabled: enabled(),
    refetchInterval: 1000,
  }))
}

export function createInitializeGame() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const { data, error } = await api.api.gameplay({ roomId: input.roomId }).initialize.post()
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

export function createFlipCard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string; cardId: number }) => {
      const { data, error } = await api.api.gameplay({ roomId: input.roomId }).flip.post({ cardId: input.cardId })
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string; cardId: number }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

export function createResetFlipped() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const { data, error } = await api.api.gameplay({ roomId: input.roomId }).reset.post()
      if (error) throw new Error(getErrorMessage(error))
      if (data && 'error' in data) throw new Error(data.message)
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  }))
}

// Milito game queries and mutations
export function createMilitoState(roomId: () => string, enabled: () => boolean) {
  return createQuery(() => ({
    queryKey: ['milito', roomId()],
    queryFn: async () => {
      const res = await fetch(`/api/milito/${roomId()}/state`, { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to fetch game state')
      }
      return res.json()
    },
    enabled: enabled(),
    refetchInterval: 1000,
  }))
}

export function createInitializeMilito() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string }) => {
      const res = await fetch(`/api/milito/${input.roomId}/initialize`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to initialize')
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  }))
}

export function createMilitoSelectCard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string; cardIndex: number }) => {
      const res = await fetch(`/api/milito/${input.roomId}/select-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cardIndex: input.cardIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to select card')
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string; cardIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

export function createMilitoSelectColumn() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string; columnIndex: number }) => {
      const res = await fetch(`/api/milito/${input.roomId}/select-column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ columnIndex: input.columnIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to select column')
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string; columnIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

export function createMilitoDiscard() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: async (input: { roomId: string; cardIndex: number }) => {
      const res = await fetch(`/api/milito/${input.roomId}/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cardIndex: input.cardIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to discard')
      return data
    },
    onSuccess: (_: unknown, variables: { roomId: string; cardIndex: number }) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  }))
}

// Standalone API client for use outside components (e.g., in route guards)
export const apiClient = {
  auth: {
    me: async () => {
      const res = await fetch('/api/auth/get-session', {
        credentials: 'include',
      })
      if (!res.ok) return null
      const data = await res.json()
      return data?.user || null
    },
  },
}
