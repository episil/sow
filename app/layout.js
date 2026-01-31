import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// 1. 設定字體
const notoMinimal = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto",
});

// 2. 獨立匯出 viewport
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1117',
};

// 3. 獨立匯出 metadata
export const metadata = {
  title: "解說員的荒野生活 2.0",
  description: "荒野保護協會志工專屬的定點觀察與情報回報系統",
  manifest: "/manifest.json",
  icons: {
    icon: '/icons/icon-512x512.png',
    apple: '/icons/icon-512x512.png', // iPhone 會用這張
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "荒野生活",
  },
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

        {/* 全域背景裝飾 */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
          <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-green-100/20 blur-[100px] rounded-full" />
        </div>

        {/* 4. 註冊 PWA Service Worker (Inline Script 方式) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('PWA Ready:', reg.scope); },
                    function(err) { console.log('PWA Error:', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
