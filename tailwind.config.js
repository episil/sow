/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. 擴充字體：優先使用 Noto Sans TC
      fontFamily: {
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
      // 2. 擴充圓角：定義 2.0 版標誌性的超大圓角
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem', // 這是我們卡片主要使用的圓角
      },
      // 3. 擴充顏色：針對 SOW 2.0 介面優化
      colors: {
        sow: {
          green: '#39d353', // 螢光綠 (熱圖最高階)
          dark: '#0d1117',  // 深色背景 (排行榜使用)
          card: '#161b22',  // 深色卡片背景
        },
      },
      // 4. 自定義動畫
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // 5. 確保支援毛玻璃效果
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    // 讓 Tailwind 支援更細膩的動畫指令
    require("tailwindcss-animate"),
  ],
};
