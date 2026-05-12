import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // Agregamos el plugin oficial de Vite

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // Esto activa Tailwind directamente en el motor de Vite
  ],
})
