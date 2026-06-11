/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "slate-dark": "#3A434D",
        "slate-medium": "#4B5663",
        "slate-light": "#8E9AA6",
        "satin-copper": "#A66E53",
        "satin-copper-hover": "#8E5B43",
        "satin-copper-light": "#C28E75",
        "rose-champagne": "#F2E7E2",
        "rose-champagne-light": "#FBF8F6",
        "pure-white": "#FFFFFF",
        "muted-olive": "#7A8068",
        "error": "#BA1A1A",
        "error-container": "#FFDAD6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        "luxury": "0 15px 40px rgba(58, 67, 77, 0.04)",
        "glass": "0 8px 32px 0 rgba(166, 110, 83, 0.05)",
      },
    },
  },
  plugins: [],
}
