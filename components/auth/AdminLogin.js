'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. 嘗試登入 (驗證 Auth 系統中的帳密)
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. 檢查 profiles 表中的管理員權限與是否需要重設密碼
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, needs_password_reset')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        // 如果不是管理員，強制登出，確保安全
        await supabase.auth.signOut();
        throw new Error('存取拒絕：您不具備管理員權限。');
      }

      // 3. 檢查是否為第一次登入（需要重設密碼）
      if (profile.needs_password_reset) {
        alert("這是您第一次登入，請先修改初始密碼。");
        // 導向修改密碼頁面 (請確保您的路由中有此路徑)
        window.location.href = '/reset-password';
        return; // 中止後續跳轉
      }

      // 4. 登入成功且無須重設，導向管理後台
      window.location.href = '/dashboard'; 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* 返回按鈕 */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">返回首頁</span>
      </button>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">管理員登入</h2>
          <p className="text-slate-400 text-sm font-bold mt-1">請輸入管理憑證以存取系統</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">管理員信箱</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                placeholder="admin@sow.org.tw"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">安全密碼</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm shadow-lg shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : '驗證身分並登入'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
          Secured by Wilderness Intelligence System
        </p>
      </div>
    </div>
  );
}
