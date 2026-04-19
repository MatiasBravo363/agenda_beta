/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe5ff',
          500: '#3b5bdb',
          600: '#2f4bc3',
          700: '#2740a6',
        },
        estado: {
          cola: '#2563eb',
          coordinado: '#dc2626',
          agendado: '#ea580c',
          santiago: '#16a34a',
          fallida: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
