'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 匯入所有功能組件
import SignInView from '@/components/auth/SignInView';
import CheckinView from '@/components/checkin/CheckinView';
import CheckInFeedback from '@/components/checkin/CheckInFeedback';
import SpeciesIntelligence from '@/components/intelligence/SpeciesIntelligence';
import UserStats from '@/components/stats/UserStats';
import Leaderboard from '@/components/stats/Leaderboard';
import SOWtalks from '@/components/SOWtalks';

// 匯入圖標
import { 
  Home, 
  Camera, 
  Trophy, 
  User as UserIcon, 
  LogOut,
  Leaf,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // home, camera, rank, profile
  const [showSOWtalks, setShowSOWtalks] = useState(false); // 控制 SOWtalks 子頁面顯示

  // 1. 初始化檢查登入狀態
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

const fetchProfile = async (userId) => {
  try {
    // 1. 先嘗試獲取現有資料
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // 2. 如果找不到資料 (說明是新志工)，立刻幫他建立一筆基礎資料
      console.log("偵測到新志工，正在建立個人檔案...");
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            full_name: session?.user?.user_metadata?.full_name || '新夥伴',
            nature_name: '', // 讓志工之後再填
            branch: '未設定',
            volunteer_group: '未設定'
          }
        ])
        .select()
        .single();

      if (!insertError) setProfile(newProfile);
    } else if (!error && data) {
      // 3. 找到現有資料，直接帶入
      setProfile(data);
    }
  } catch (err) {
    console.error("處理 Profile 時發生異常:", err);
  } finally {
    // 無論成功或失敗，都要關閉載入狀態，避免畫面卡死
    setLoading(false);
  }
};

  // 登出功能
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('home');
    setShowSOWtalks(false);
  };

  // 門禁處理
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <Leaf className="text-blue-500 mb-4" size={40} />
        <p className="text-slate-400 font-bold text-sm tracking-widest">載入荒野生活中...</p>
      </div>
    </div>
  );

  if (!session || !profile) {
    return <SignInView onLoginSuccess={(p) => setProfile(p)} />;
  }

  // 2. 分頁內容渲染邏輯
  const renderContent = () => {
    if (showSOWtalks) {
      return (
        <SOWtalks 
          onBack={() => setShowSOWtalks(false)} 
          registrationUrl="https://example.com/register" 
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center mb-2 px-2">
              <div>
                <h1 className="text-2xl font-black text-slate-800">你好，{profile.nature_name || profile.full_name}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{profile.branch} · {profile.volunteer_group}</p>
              </div>
              <button onClick={handleSignOut} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </header>

            {/* 功能卡片區 */}
            <CheckinView profile={profile} />

            {/* SOWtalks 入口卡片 */}
            <div 
              onClick={() => setShowSOWtalks(true)}
              className="group relative overflow-hidden w-full p-6 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2.5rem] text-white cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-emerald-100"
            >
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-yellow-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">近期熱門活動</span>
                  </div>
                  <h4 className="font-black text-lg">荒野 Show 與你</h4>
                  <p className="text-xs opacity-80 font-bold mt-1">別讓你的發現，只留在野外</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Leaf size={120} />
              </div>
            </div>

            <CheckInFeedback profile={profile} />
          </div>
        );
      case 'camera':
        return <div className="animate-in fade-in duration-500"><SpeciesIntelligence profile={profile} /></div>;
      case 'rank':
        return <div className="animate-in fade-in duration-500"><Leaderboard /></div>;
      case 'profile':
        return <div className="animate-in fade-in duration-500"><UserStats profile={profile} /></div>;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-32 pt-8 px-4 md:max-w-md md:mx-auto relative">
      <div className="max-w-full overflow-hidden">
        {renderContent()}
      </div>

      {!showSOWtalks && (
        <nav className="fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/20 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-50 md:max-w-md md:left-1/2 md:-translate-x-1/2">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home size={22} />} 
            label="首頁" 
          />
          <NavButton 
            active={activeTab === 'camera'} 
            onClick={() => setActiveTab('camera')} 
            icon={<Camera size={22} />} 
            label="情報" 
          />
          <NavButton 
            active={activeTab === 'rank'} 
            onClick={() => setActiveTab('rank')} 
            icon={<Trophy size={22} />} 
            label="排行" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<UserIcon size={22} />} 
            label="我的" 
          />
        </nav>
      )}
    </main>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${
        active ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'
      }`}
    >
      <div className={`${active ? 'bg-blue-50 p-2 rounded-xl' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </span>
    </button>
  );
}
