/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "slate-dark": "#4A2E1A",
        "slate-medium": "#8C6550",
        "slate-light": "#A08271",
        // Botones y acentos ahora en rose-petal / satin-copper
        "satin-copper": "#9B5E45",
        "satin-copper-hover": "#824E38",
        "satin-copper-light": "#C4845A",
        "rose-champagne": "#C4845A",
        "rose-champagne-light": "#F0E4D8",
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
        "glass": "0 8px 32px 0 rgba(224, 162, 162, 0.05)",
      },
    },
  },
  plugins: [],
}
