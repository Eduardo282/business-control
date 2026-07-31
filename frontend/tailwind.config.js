/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          app: "var(--color-app-background)",
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
        control: {
          border: "var(--color-control-border)",
          disabled: "var(--color-control-disabled)",
        },
        focus: "var(--color-focus)",
        brand: {
          DEFAULT: "var(--color-brand)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          surface: "var(--color-danger-surface)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          surface: "var(--color-success-surface)",
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
          bg: "#F1F5F9", // Fondo principal
          card: "#FFFFFF", // Tarjetas / Paneles
          text: {
            primary: "#1A2B4C", // Encabezados
            secondary: "#475569",
            body: "#181818",
            muted: "#64748B",
          },
          accent: "#1D4ED8", // Azul accesible
          accentHover: "#1E40AF",
          border: "#94A3B8", // Bordes de controles
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
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
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
  plugins: [],
};
