/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cozy: {
          50: "#faf6f1",
          100: "#f3ebe0",
          200: "#e6d4c0",
          300: "#d4b89a",
          400: "#c49a74",
          500: "#b67f5a",
          600: "#a86a4a",
          700: "#8c543e",
          800: "#724536",
          900: "#5d3a2f",
        },
        plum: {
          400: "#9b82d4",
          500: "#7c5cbf",
          600: "#6a4da8",
          700: "#5a3f8f",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
