/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        destructive: "var(--color-destructive)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
      },
    },
  },
  plugins: [],
};