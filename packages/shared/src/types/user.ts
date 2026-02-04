export interface User {
  id: number
  email: string
  name: string
  createdAt: Date | null
}

export interface SessionUser {
  id: number
  email: string
  name: string
}
