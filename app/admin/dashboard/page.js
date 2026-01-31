components/auth/dashboard.js

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  MessageSquare, 
  LogOut, 
  ChevronRight, 
  TrendingUp,
  Settings,
  Bell,
  ArrowLeft
} from 'lucide-react';

export default function AdminDashboard() {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        alert('無權限存取');
        window.location.href = '/';
        return;
      }

      setAdminProfile(profile);
      setLoading(false);
    };

    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin text-slate-400">
        <ShieldCheck size={40} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12 pt-8 px-4 md:max-w-4xl md:mx-auto text-left">
      {/* 頂部列 */}
      <header className="flex justify-between items-center mb-8 px-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">管理主控台</h1>
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">系統管理員：{adminProfile?.nature_name || adminProfile?.full_name}</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* 數據概覽卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={18} />} label="總會員數" value="128" color="bg-blue-500" />
        <StatCard icon={<MapPin size={18} />} label="簽到地點" value="14" color="bg-green-500" />
        <StatCard icon={<TrendingUp size={18} />} label="今日簽到" value="45" color="bg-orange-500" />
        <StatCard icon={<MessageSquare size={18} />} label="未讀回饋" value="12" color="bg-red-500" />
      </div>

      {/* 管理功能區塊 */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">功能管理</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminMenuButton 
            title="地點管理" 
            desc="新增、編輯或隱藏簽到熱點" 
            icon={<MapPin size={24} />} 
            onClick={() => {}}
          />
          <AdminMenuButton 
            title="使用者權限" 
            desc="管理會員資料與管理員授權" 
            icon={<ShieldCheck size={24} />} 
            onClick={() => {}}
          />
          <AdminMenuButton 
            title="意見回饋" 
            desc="查看並處理使用者提交的建議" 
            icon={<MessageSquare size={24} />} 
            onClick={() => {}}
          />
          <AdminMenuButton 
            title="系統設定" 
            desc="調整應用程式全域參數" 
            icon={<Settings size={24} />} 
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

// 數據統計小卡
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className={`w-8 h-8 ${color} text-white rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-100`}>
        {icon}
      </div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
      <h2 className="text-2xl font-black text-slate-800">{value}</h2>
    </div>
  );
}

// 功能選單大卡
function AdminMenuButton({ title, desc, icon, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group text-left w-full"
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="font-black text-slate-800">{title}</h4>
          <p className="text-xs text-slate-400 font-bold">{desc}</p>
        </div>
      </div>
      <div className="text-slate-200 group-hover:text-blue-500 transition-colors">
        <ChevronRight size={24} />
      </div>
    </button>
  );
}
