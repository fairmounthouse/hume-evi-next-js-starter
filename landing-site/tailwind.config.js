/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Butter.us inspired yellows
        'yellow-primary': '#FEDD00',
        'yellow-bright': '#FFE234',
        'yellow-light': '#FFF9E6',
        'yellow-pale': '#FFFCF0',
        // Supporting colors
        'blue-accent': '#3B82F6',
        'blue-light': '#DBEAFE',
        'green-light': '#D1FAE5',
        'orange-accent': '#FB923C',
        'pink-accent': '#EC4899',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      animation: {
        'float': 'float 20s infinite ease-in-out',
        'pulse-dot': 'pulse 2s infinite',
        'bounce-dot': 'bounce 1.4s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(5deg)' },
          '50%': { transform: 'translateY(0) rotate(10deg)' },
          '75%': { transform: 'translateY(20px) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}
