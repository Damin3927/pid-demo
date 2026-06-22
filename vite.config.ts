import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://damin3927.github.io/pid-demo/ in production, root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pid-demo/' : '/',
  plugins: [react(), tailwindcss()],
}))
