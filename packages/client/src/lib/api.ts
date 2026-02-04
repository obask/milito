/**
 * Fetch-based API client for FastAPI backend.
 */

const BASE_URL = '/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...init } = options

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }))
    throw new Error(error.detail || error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth types
export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionResponse {
  session: { active: boolean } | null
  user: User | null
}

// Game types
export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  imageUrl?: string | null
  createdAt: string
}

export interface Player {
  id: string
  odlerId: string
  position: number
  score: number
}

export interface Room {
  id: string
  name: string
  gameId: string
  hostId: string
  status: string
  maxPlayers: number
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  players: Player[]
}

export interface RoomListItem {
  id: string
  name: string
  gameId: string
  gameName?: string | null
  gameImage?: string | null
  hostId: string
  status: string
  maxPlayers: number
  playerCount: number
  createdAt: string
}

// API client
export const api = {
  auth: {
    me: () => request<SessionResponse>('/auth/get-session'),
    login: (data: { email: string; password: string }) =>
      request<User>('/auth/sign-in/email', { method: 'POST', body: data }),
    register: (data: { email: string; password: string; name: string }) =>
      request<User>('/auth/sign-up/email', { method: 'POST', body: data }),
    logout: () => request<{ success: boolean }>('/auth/sign-out', { method: 'POST' }),
  },
  games: {
    list: () => request<Game[]>('/games'),
    get: (gameId: string) => request<Game>(`/games/${gameId}`),
    rooms: {
      list: (options?: { gameId?: string; status?: string }) => {
        const params = new URLSearchParams()
        if (options?.gameId) params.set('gameId', options.gameId)
        if (options?.status) params.set('status', options.status)
        const query = params.toString()
        return request<RoomListItem[]>(`/games/rooms${query ? `?${query}` : ''}`)
      },
      get: (roomId: string) => request<Room>(`/games/rooms/${roomId}`),
      create: (data: { gameId: string; name: string; maxPlayers: number }) =>
        request<{ roomId: string }>('/games/rooms', { method: 'POST', body: data }),
      join: (roomId: string) =>
        request<{ success: boolean }>(`/games/rooms/${roomId}/join`, { method: 'POST' }),
      leave: (roomId: string) =>
        request<{ success: boolean }>(`/games/rooms/${roomId}/leave`, { method: 'POST' }),
      start: (roomId: string) =>
        request<{ success: boolean }>(`/games/rooms/${roomId}/start`, { method: 'POST' }),
    },
  },
  gameplay: {
    getState: (roomId: string) => request<unknown>(`/gameplay/${roomId}/state`),
    initialize: (roomId: string) =>
      request<{ success: boolean }>(`/gameplay/${roomId}/initialize`, { method: 'POST' }),
    flip: (roomId: string, cardId: number) =>
      request<{ success: boolean; state: unknown }>(`/gameplay/${roomId}/flip`, {
        method: 'POST',
        body: { cardId },
      }),
    reset: (roomId: string) =>
      request<{ success: boolean; state: unknown }>(`/gameplay/${roomId}/reset`, { method: 'POST' }),
  },
  milito: {
    getState: (roomId: string) => request<unknown>(`/milito/${roomId}/state`),
    initialize: (roomId: string) =>
      request<{ success: boolean }>(`/milito/${roomId}/initialize`, { method: 'POST' }),
    selectCard: (roomId: string, cardIndex: number) =>
      request<{ success: boolean; state: unknown }>(`/milito/${roomId}/select-card`, {
        method: 'POST',
        body: { cardIndex },
      }),
    selectColumn: (roomId: string, columnIndex: number) =>
      request<{ success: boolean; state: unknown }>(`/milito/${roomId}/select-column`, {
        method: 'POST',
        body: { columnIndex },
      }),
    discard: (roomId: string, cardIndex: number) =>
      request<{ success: boolean; state: unknown }>(`/milito/${roomId}/discard`, {
        method: 'POST',
        body: { cardIndex },
      }),
  },
}
