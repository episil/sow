import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// 1. 設定字體：Noto Sans TC 確保中文呈現厚實質感
const notoMinimal = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto",
});

// 2. 獨立匯出 viewport (解決 Next.js 15 警告並優化手機體驗)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 防止手機端輸入或雙擊時產生非預期縮放
  themeColor: '#0d1117', // SOW 2.0 深色主題色，同步網址列顏色
};

// 3. 獨立匯出 metadata (已移除內部的 viewport 屬性)
export const metadata = {
  title: "解說員的荒野生活 2.0",
  description: "荒野保護協會志工專屬的定點觀察與情報回報系統",
  manifest: "/manifest.json", // 預留給 PWA 功能使用
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoMinimal.variable} font-sans bg-slate-50 text-slate-900 antialiased`}
      >
        {/* 手機端狀態列模擬 bg */}
        <div className="fixed top-0 w-full h-safe-top bg-slate-50 z-[100]" />

        {/* 頁面主要內容 */}
        {children}

        {/* 全域背景裝飾 - 提升視覺層次感 */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
          <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-green-100/20 blur-[100px] rounded-full" />
        </div>
      </body>
    </html>
  );
}
