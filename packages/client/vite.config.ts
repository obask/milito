import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    solid(),
  ],
  server: {
    port: 5847,
    proxy: {
      '/api': {
        target: 'http://localhost:4923',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
