import PrimeUI from "tailwindcss-primeui";
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Пути для поиска классов Tailwind в Angular компонентах
  ],
  theme: {
    extend: {}, // Расширения для темы (если нужно)
  },
  plugins: [
    PrimeUI, // Подключаем PrimeUI
  ],
};
