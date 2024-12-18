/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            backgroundImage: {
                light: `url(/desktop/light.png)`,
                dark: `url(/desktop/dark.png)`,
            },
        },
    },
    plugins: [],
};
