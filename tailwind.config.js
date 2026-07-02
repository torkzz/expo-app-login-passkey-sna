/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0052cc",
        secondary: "#00a3bf",
        accent: "#ff8b00",
        background: "#f4f5f7",
      },
    },
  },
  plugins: [],
}
