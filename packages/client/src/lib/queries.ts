import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type User } from './api'

// Auth queries and mutations
export function useMe() {
  return useQuery({
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
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.auth.login(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      api.auth.register(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

// Games queries and mutations
export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: () => api.games.list(),
  })
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: ['games', gameId],
    queryFn: async () => {
      if (!gameId) return null
      return api.games.get(gameId)
    },
    enabled: !!gameId,
  })
}

export function useRooms(options?: { gameId?: string; status?: 'waiting' | 'playing' | 'finished' }) {
  return useQuery({
    queryKey: ['rooms', options],
    queryFn: () => api.games.rooms.list(options),
  })
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => api.games.rooms.get(roomId),
    refetchInterval: 2000,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { gameId: string; name: string; maxPlayers: number }) =>
      api.games.rooms.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useJoinRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.games.rooms.join(input.roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useLeaveRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.games.rooms.leave(input.roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useStartGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.games.rooms.start(input.roomId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  })
}

// Gameplay queries and mutations
export function useGameState(roomId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['gameplay', roomId],
    queryFn: () => api.gameplay.getState(roomId),
    enabled,
    refetchInterval: 1000,
  })
}

export function useInitializeGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.gameplay.initialize(input.roomId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  })
}

export function useFlipCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string; cardId: number }) =>
      api.gameplay.flip(input.roomId, input.cardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  })
}

export function useResetFlipped() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.gameplay.reset(input.roomId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gameplay', variables.roomId] })
    },
  })
}

// Milito game queries and mutations
export function useMilitoState(roomId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['milito', roomId],
    queryFn: () => api.milito.getState(roomId),
    enabled,
    refetchInterval: 1000,
  })
}

export function useInitializeMilito() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string }) => api.milito.initialize(input.roomId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId] })
    },
  })
}

export function useMilitoSelectCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string; cardIndex: number }) =>
      api.milito.selectCard(input.roomId, input.cardIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  })
}

export function useMilitoSelectColumn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string; columnIndex: number }) =>
      api.milito.selectColumn(input.roomId, input.columnIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  })
}

export function useMilitoDiscard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { roomId: string; cardIndex: number }) =>
      api.milito.discard(input.roomId, input.cardIndex),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milito', variables.roomId] })
    },
  })
}

// Standalone API client for use outside React (e.g., in route loaders)
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
