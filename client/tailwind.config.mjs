/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        mono: ["Consolas", "monospace"],
      },
      keyframes: {
        flyOff: {
          "0%": { transform: "translate(0, 0)", opacity: "1" },
          "50%": { transform: "translate(50px, -50px)", opacity: "0.5" },
          "100%": { transform: "translate(200px, -200px)", opacity: "0" },
        },
      },
      animation: {
        flyOff: "flyOff 0.8s forwards",
      },
    },
  },
  plugins: [],
};
