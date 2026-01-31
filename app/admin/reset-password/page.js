'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // 確保使用者已登入，否則導回登入頁
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/'; 
      }
    };
    checkUser();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: '兩次輸入的密碼不一致' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: '密碼長度至少需要 6 位數' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // 1. 更新 Supabase Auth 的密碼
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      // 2. 更新 profiles 表，將 needs_password_reset 設為 false
      const { data: { user } } = await supabase.auth.getUser();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ needs_password_reset: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. 成功處理
      setStatus({ type: 'success', message: '密碼重設成功！即將前往管理後台...' });
      
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 text-left">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-100">
              <KeyRound size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">重設管理員密碼</h2>
            <p className="text-slate-400 text-sm font-bold mt-1 text-center px-4">
              為了系統安全，請設定您的新密碼
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {status.message && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <p className="text-xs font-bold leading-relaxed">{status.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">新密碼</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="請輸入新密碼"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">確認新密碼</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="再次輸入新密碼"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || status.type === 'success'}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm shadow-lg shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : '更新密碼並進入系統'}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-300 font-bold mt-8 tracking-widest uppercase">
            荒野情報系統安全中心
          </p>
        </div>
      </div>
    </main>
  );
}
