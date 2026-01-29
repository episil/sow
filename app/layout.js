import { Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// 設定字體：Inter 用於數字，Noto Sans TC 用於中文
const notoMinimal = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto",
});

export const metadata = {
  title: "解說員的荒野生活 2.0",
  description: "荒野保護協會志工專屬的定點觀察與情報回報系統",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // 防止手機端輸入時縮放
  manifest: "/manifest.json", // 若您未來要轉為 PWA
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoMinimal.variable} font-sans bg-slate-50 text-slate-900 antialiased`}
      >
        {/* 手機端狀態列模擬 bg (可選) */}
        <div className="fixed top-0 w-full h-safe-top bg-slate-50 z-[100]" />

        {/* 頁面主要內容 */}
        {children}

        {/* 全域背景裝飾 - 淡淡的綠色光暈提升質感 */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
          <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-green-100/20 blur-[100px] rounded-full" />
        </div>
      </body>
    </html>
  );
}
