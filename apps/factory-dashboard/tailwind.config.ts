import type { Config } from "tailwindcss";

/**
 * Factory Dashboard theme — "technical control room". All colors come from
 * the CSS variables in app/globals.css via hsl(var(--token)) so opacity
 * modifiers work; no ad-hoc hex values in components. Neon glows are exposed
 * as boxShadow tokens so their intensity stays consistent everywhere.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "Segoe UI", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "JetBrains Mono",
          "SFMono-Regular",
          "Consolas",
          "monospace",
        ],
      },
      /* Subtle neon glows — soft shadows, never harsh halos. */
      boxShadow: {
        "glow-primary": "0 0 20px -6px hsl(var(--primary) / 0.5)",
        "glow-primary-sm": "0 0 12px -4px hsl(var(--primary) / 0.4)",
        "glow-success": "0 0 16px -6px hsl(var(--success) / 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /* Soft breathing glow for the live pipeline phase. Gate usage behind
           the motion-safe: variant so prefers-reduced-motion is respected. */
        "phase-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 hsl(var(--primary) / 0.30), 0 0 12px -2px hsl(var(--primary) / 0.35)",
          },
          "50%": {
            boxShadow:
              "0 0 0 6px hsl(var(--primary) / 0), 0 0 20px -2px hsl(var(--primary) / 0.55)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "phase-pulse": "phase-pulse 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
