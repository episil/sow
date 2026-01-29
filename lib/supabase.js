import { createClient } from '@supabase/supabase-js';

// 從環境變數中讀取 API 金鑰
// 在 Next.js 中，環境變數必須以 NEXT_PUBLIC_ 開頭才能在前端存取
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 安全檢查：確保環境變數已設定
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('錯誤：找不到 Supabase 環境變數。請檢查 .env.local 檔案。');
}

// 初始化 Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
