/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        light: "url('/image/light.png')",
        dark: "url('/image/dark.png')",
      },
    },
  },
  plugins: [],
};
