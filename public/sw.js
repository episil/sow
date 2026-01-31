// 基礎 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker 正在安裝...');
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // 這裡可以保持空白，瀏覽器只要偵測到此檔案存在即可啟動安裝功能
});
