'use client';

import React from 'react';
import { 
  ChevronLeft, 
  Sparkles, 
  Calendar, 
  Users, 
  Target, 
  Rocket, 
  Heart, 
  ExternalLink,
  Mic2,
  Quote
} from 'lucide-react';

export default function SOWtalks({ onBack, registrationUrl }) {
  // 假設下一場活動資訊，未來可改由 Props 傳入
  const nextEvent = {
    date: "2026/03/10",
    time: "週二 19:30",
    theme: "開放自訂主題",
    limit: 30
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* 返回導覽 */}
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-slate-400 font-black text-sm hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={18} /> 返回首頁
        </button>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Community Event</span>
      </div>

      {/* 核心 Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-yellow-300" size={20} />
            <span className="text-[10px] font-black tracking-widest uppercase opacity-80">Show of Wilderness</span>
          </div>
          <h1 className="text-3xl font-black mb-4 tracking-tight">荒野 Show 與你</h1>
          <p className="text-emerald-50 text-sm font-bold leading-relaxed opacity-90">
            別讓你的發現只留在野外。<br />
            每個月一次，把大自然的奧秘轉化為感人的解說力量。
          </p>
        </div>
        <Mic2 className="absolute -right-8 -bottom-8 text-white/10" size={200} />
      </div>

      {/* 共鳴區塊 */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <Quote className="absolute top-6 left-6 text-slate-50" size={40} />
        <div className="relative z-10">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Heart className="text-red-400" size={20} />
            身為解說員的你...
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed font-bold">
            曾目睹一場精彩的蟲鳴大戰卻沒人可以分享？那些珍貴的快門、手繪筆記、對生命的感悟，不該只塵封在資料夾裡，它們是最高級的解說素材！
          </p>
        </div>
      </div>

      {/* 特色網格 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-emerald-600">
            <Users size={20} />
          </div>
          <h4 className="font-black text-emerald-900 text-sm mb-2">觀察日誌派對</h4>
          <p className="text-emerald-700/60 text-[10px] leading-relaxed font-bold">
            精選十位分享者，限時九分鐘，點燃你的觀察靈感。
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-blue-600">
            <Target size={20} />
          </div>
          <h4 className="font-black text-blue-900 text-sm mb-2">腳本共創</h4>
          <p className="text-blue-700/60 text-[10px] leading-relaxed font-bold">
            三十人集思廣益，將觀察案例轉化為動人故事。
          </p>
        </div>
      </div>

      {/* 下場預告卡片 */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-yellow-400 font-black flex items-center gap-2">
              <Calendar size={20} /> 下場預告
            </h3>
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white/60">
              限額 {nextEvent.limit} 名
            </div>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-1 bg-yellow-400 h-10 rounded-full"></div>
              <div>
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Date & Time</div>
                <div className="text-lg font-black">{nextEvent.date} {nextEvent.time}</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-1 bg-emerald-400 h-10 rounded-full"></div>
              <div>
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Theme</div>
                <div className="text-lg font-black">{nextEvent.theme}</div>
              </div>
            </div>
          </div>

          {/* 報名連結按鈕 */}
          <a 
            href={registrationUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
          >
            立即填寫報名表單 <ExternalLink size={16} />
          </a>
        </div>
        <Rocket className="absolute -right-4 -bottom-4 text-white/5" size={120} />
      </div>

      <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
        每月第二個週二晚上，為你保留一個位置
      </p>
    </div>
  );
}
