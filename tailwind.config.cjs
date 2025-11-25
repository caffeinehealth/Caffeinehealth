/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '../caffeine.jsx'
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          900: '#92400e'
        },
        orange: {
          600: '#d97706'
        },
        yellow: {
          50: '#fffbeb'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
