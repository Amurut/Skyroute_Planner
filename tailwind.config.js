/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#070a11",
        surface: "#090d16",
        "surface-container-lowest": "#060910",
        "surface-container-low": "#10141f",
        "surface-container": "#151925",
        "surface-container-high": "#1f2432",
        "surface-container-highest": "#282d3b",
        "surface-variant": "#1e2330",
        "on-surface": "#f0f3ff",
        "on-surface-variant": "#a2b0ba",
        primary: "#4cd7f6",
        "primary-container": "#06b6d4",
        "on-primary": "#003640",
        secondary: "#4edea3",
        "secondary-container": "#00a572",
        "on-secondary": "#003824",
        tertiary: "#ffb95f",
        "tertiary-container": "#e79400",
        "on-tertiary": "#472a00",
        outline: "#7a8790",
        "outline-variant": "#2a3240",
        error: "#ffb4ab",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
