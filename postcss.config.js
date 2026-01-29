module.exports = {
  plugins: {
    // 處理 Tailwind CSS 的指令
    tailwindcss: {},
    
    // 自動為 CSS 加上瀏覽器前綴（例如 -webkit-）
    // 確保 2.5rem 的圓角與 Backdrop Blur 在舊版手機瀏覽器也能運作
    autoprefixer: {},
    
    // 針對生產環境優化與壓縮 CSS (選擇性，通常由 Next.js 內建處理)
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  },
}
