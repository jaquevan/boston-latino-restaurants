/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cariblue: "#2E86AB",
        plantain: "#F4A261",
        coral: "#E76F51",
        oceanmint: "#80CED7",
        cafe: "#2A2A2A",
        coco: "#F7F7F7",
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        latino: {
          "primary": "#2E86AB",
          "secondary": "#E76F51",
          "accent": "#F4A261",
          "neutral": "#2A2A2A",
          "base-100": "#FFFFFF",
          "base-200": "#F7F7F7",
          "info": "#2E86AB",
          "success": "#80CED7",
          "warning": "#F4A261",
          "error": "#E76F51",
        },
      },
    ],
  },
}
