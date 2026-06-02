/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          elevated: "var(--color-surface-elevated)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        border: {
          semantic: "var(--color-border)",
        },
        brand: {
          DEFAULT: "var(--color-brand)",
        },
        dark: {
          900: "#050511",
          800: "#0f111a",
          700: "#1a1d2d",
        },
        primary: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          glow: "rgba(59, 130, 246, 0.5)",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          glow: "rgba(139, 92, 246, 0.5)",
        },
        // Paleta de luz personalizada
        light: {
          bg: "#DDEBF2", // Fondo principal
          card: "#E0DFD4", // Tarjetas / Paneles
          text: {
            primary: "#313357", // Encabezados
            secondary: "#848484",
            body: "#181818",
            muted: "#B1B1B1",
          },
          accent: "#1543F0", // Azul brillante
          accentHover: "#365C87",
          border: "#ACB9B0", // Bordes
          warning: "#FEEBC6",
          error: "#611B1B",
          highlight: "#BCC5E6", // Selección/Resaltado
          decorative: {
            terra: "#CF9477",
            cyan: "#BDCBCE",
          },
        },
        glass: {
          100: "rgba(255, 255, 255, 0.05)",
          200: "rgba(255, 255, 255, 0.1)",
          300: "rgba(255, 255, 255, 0.15)",
          border: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blob: "blob 7s infinite",
        "slot-reel": "slotReel 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "lever-pull": "leverPull 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slotReel: {
          "0%": { opacity: "0", transform: "translateY(-60px) scale(0.9)" },
          "50%": { opacity: "0.7", transform: "translateY(8px) scale(1.02)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        leverPull: {
          "0%": { transform: "rotate(0deg)" },
          "40%": { transform: "rotate(35deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "neon-blue":
          "0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)",
        "neon-purple":
          "0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-stroke": {
          "-webkit-text-stroke": "1px black",
        },
        ".text-stroke-2": {
          "-webkit-text-stroke": "2px black",
        },
        ".text-stroke-white": {
          "-webkit-text-stroke-color": "white",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
