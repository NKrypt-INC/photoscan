/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,html}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#06080c",
          900: "#0b0f17",
          800: "#111726",
          700: "#1a2236",
          600: "#26314a",
          500: "#3a4763",
          400: "#5a6685",
          300: "#8590ad",
          200: "#b7bdd0",
          100: "#dde1ec",
          50: "#f3f5fa",
        },
        accent: {
          DEFAULT: "#7df3c6",
          bright: "#9bffd6",
          dim: "#4fcfa1",
        },
        alarm: "#ff6a6a",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Space Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        container: "1240px",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.25)", opacity: "0.6" },
        },
      },
      animation: {
        rise: "rise 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        fade: "fade 600ms ease both",
        pulseDot: "pulseDot 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
