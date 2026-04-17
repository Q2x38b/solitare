import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves from https://<user>.github.io/solitare/ so all
// built assets need to be prefixed with /solitare/. In dev we want "/".
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/solitare/' : '/',
}))
