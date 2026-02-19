/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8b5cf6", // Neon Purple
        secondary: "#ec4899", // Neon Pink
        bgMain: "#09090b", // Deep Tech Black
        surface: "#18181b", // Darker Surface
        inputBg: "#27272a", // Dark Input
        borderCol: "#3f3f46", // Grid/Border Line
        textMuted: "#a1a1aa", // Muted Gray
      },
      animation: {
        "data-fall": "dataFall 4s linear infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
      },
      keyframes: {
        dataFall: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
