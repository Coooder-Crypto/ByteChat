/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214, 15%, 91%)",
        input: "hsl(214, 15%, 91%)",
        ring: "#2f7cf7",
        background: "#f5f7fb",
        foreground: "#0f172a",
      },
    },
  },
  plugins: [],
};
