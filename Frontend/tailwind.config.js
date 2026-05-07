/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gestock: {
          dark: '#0B192C',  // El azul marino profundo del fondo del logo
          blue: '#1E3A8A',  // Azul principal corporativo
          cyan: '#00D2C4',  // El cian/celeste brillante de la "G" y las flechas
          light: '#F8FAFC'  // Gris muy claro para los fondos de la app
        }
      }
    },
  },
  plugins: [],
}