type ApiResult<T = unknown> = Promise<{ data: T | null; error: unknown | null }>

async function request<T = unknown>(path: string, init?: RequestInit): ApiResult<T> {
  const res = await fetch(path, { credentials: 'include', ...init })
  const data = await res.json().catch(() => null)
  if (!res.ok) return { data, error: { value: data } }
  return { data, error: null }
}

const post = (path: string, body?: unknown) =>
  request(path, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const api = {
  api: {
    games: Object.assign(
      (params: { gameId: string }) => ({
        get: () => request(`/api/games/${params.gameId}`),
      }),
      {
        rooms: Object.assign(
          (params: { roomId: string }) => ({
            get: () => request(`/api/games/rooms/${params.roomId}`),
            join: { post: () => post(`/api/games/rooms/${params.roomId}/join`) },
            leave: { post: () => post(`/api/games/rooms/${params.roomId}/leave`) },
            start: { post: () => post(`/api/games/rooms/${params.roomId}/start`) },
          }),
          {},
        ),
      },
    ),
    gameplay: (params: { roomId: string }) => ({
      state: { get: () => request(`/api/gameplay/${params.roomId}/state`) },
      initialize: { post: () => post(`/api/gameplay/${params.roomId}/initialize`) },
      flip: { post: (body: unknown) => post(`/api/gameplay/${params.roomId}/flip`, body) },
      reset: { post: () => post(`/api/gameplay/${params.roomId}/reset`) },
    }),
  },
}
