/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "slate-dark": "#201823",
        "slate-medium": "#6D5572",
        "slate-light": "#9E8B9F",
        "satin-copper": "#A891AA",
        "satin-copper-hover": "#947A96",
        "satin-copper-light": "#D0AFC6",
        "rose-champagne": "#DBBCCC",
        "rose-champagne-light": "#FAF6F9",
        "pure-white": "#FFFFFF",
        "muted-olive": "#059669",
        "error": "#EF4444",
        "error-container": "#FEE2E2",
        // Paleta Específica Faded Lilac (CellGenic Luxury Style)
        "lilac-dark": "#201823",
        "lilac-deep": "#4A354E",
        "lilac-muted": "#6D5572",
        "lilac-accent": "#A891AA",
        "lilac-faded": "#D0AFC6",
        "lilac-mist": "#DBBCCC",
        "lilac-soft": "#E8D7E3",
        "lilac-blush": "#F8E3EC",
        "lilac-pearl": "#FAF6F9",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Cormorant Garamond", "serif"],
      },
      boxShadow: {
        "luxury": "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03)",
        "bento": "0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 30px rgba(0, 0, 0, 0.04)",
        "bento-hover": "0 1px 3px rgba(0, 0, 0, 0.04), 0 10px 40px rgba(0, 0, 0, 0.08)",
        "glass": "0 4px 20px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
}
