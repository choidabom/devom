/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            backgroundImage: {
                light: "url('../public/desktop/light.png')",
                dark: "url('../public/desktop/dark.png')",
            },
        },
    },
    plugins: [],
};
