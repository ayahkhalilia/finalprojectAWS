import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
// https://vite.dev/config/
/*export default defineConfig({
  plugins: [react()],
})*/
