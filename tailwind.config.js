/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "slate-dark": "#111111",
        "slate-medium": "#6B7280",
        "slate-light": "#9CA3AF",
        "satin-copper": "#E0BAA8",
        "satin-copper-hover": "#D4A899",
        "satin-copper-light": "#E2CCA3",
        "rose-champagne": "#D4A899",
        "rose-champagne-light": "#F7F8FA",
        "pure-white": "#FFFFFF",
        "muted-olive": "#059669",
        "error": "#EF4444",
        "error-container": "#FEE2E2",
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
