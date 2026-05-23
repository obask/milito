import { createFileRoute } from '@tanstack/react-router'
import { handleApiRequest } from '../server/api.js'

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleApiRequest(request),
      POST: ({ request }: { request: Request }) => handleApiRequest(request),
      PUT: ({ request }: { request: Request }) => handleApiRequest(request),
      DELETE: ({ request }: { request: Request }) => handleApiRequest(request),
    },
  },
})
