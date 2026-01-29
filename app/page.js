'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 匯入所有功能組件
import SignInView from '@/components/auth/SignInView';
import CheckinView from '@/components/checkin/CheckinView';
import CheckInFeedback from '@/components/checkin/CheckInFeedback';
import SpeciesIntelligence from '@/components/intelligence/SpeciesIntelligence';
import SpeciesList from '@/components/SpeciesList'; // 👈 確保匯入新組件
import UserStats from '@/components/stats/UserStats';
import Leaderboard from '@/components/stats/Leaderboard';
import SOWtalks from '@/components/SOWtalks';

// ... 匯入圖標保持不變 ...

export default function App() {
  // ... 狀態設定 (session, profile, loading 等) 保持不變 ...

  const renderContent = () => {
    if (showSOWtalks) {
      return (
        <SOWtalks 
          onBack={() => setShowSOWtalks(false)} 
          registrationUrl="https://example.com/register" 
        />
      );
    }

    if (isEditingProfile) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-800">修改個人資料</h2>
            <button 
              onClick={() => setIsEditingProfile(false)}
              className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full"
            >
              取消修改
            </button>
          </div>
          <SignInView onLoginSuccess={handleProfileUpdate} existingProfile={profile} />
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 頁首：個人資訊 */}
            <header className="flex justify-between items-center mb-2 px-2">
              <div>
                <h1 className="text-2xl font-black text-slate-800">你好，{profile.nature_name || profile.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{profile.branch} · {profile.volunteer_group}</p>
                   <button 
                     onClick={() => setIsEditingProfile(true)}
                     className="p-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                     title="個資修改"
                   >
                     <Settings2 size={14} />
                   </button>
                </div>
              </div>
              <button onClick={handleSignOut} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </header>

            {/* 1. 簽到組件 */}
            <CheckinView profile={profile} />

            {/* 2. 物種情報牆 (依照您的要求放置於此) */}
            <div className="mt-10">
              <SpeciesList currentBranch={profile.branch} />
            </div>

            {/* 3. 荒野 Show 活動卡片 */}
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

            {/* 4. 簽到反饋內容 */}
            <CheckInFeedback profile={profile} />
          </div>
        );
      
      // ... 其他 case (camera, rank, profile) 保持不變 ...
      default:
        return null;
    }
  };

  // ... 其餘 return (main/nav) 保持不變 ...
}
