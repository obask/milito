import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '#': '/src',
    },
    tsconfigPaths: true,
  },
  plugins: [devtools(), nitro(), tailwindcss(), tanstackStart(), viteReact()],
})
