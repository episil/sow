'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Navigation, 
  HelpCircle, 
  X, 
  Info, 
  Smartphone, 
  Mail,
  Apple,
  Bot,
  ChevronRight,
  Share2,
  Menu
} from 'lucide-react';

export default function CheckinView({ profile }) {
  // ... (保留原本的 state 與 logic)
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showHelp, setShowHelp] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  // ... (保留原本的 useEffect 與 functions)

  const handleCheckin = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('checkin_records').insert([{
        user_id: profile.id,
        location_name: selectedLocation,
        branch: profile.branch,
        volunteer_group: profile.volunteer_group
      }]);
      if (error) throw error;
      setStatus('success');
      setTimeout(() => { setStatus('idle'); setSelectedLocation(''); setDistance(null); }, 3000);
    } catch (error) {
      alert('簽到失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckinDisabled = !selectedLocation || isSubmitting || (selectedLocation !== '自由定點' && (distance === null || distance > 1));

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative text-left">
      
      {/* 幫助說明彈窗 */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Info className="text-blue-600" size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">使用說明</h3>
                </div>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-8">
                {/* 簽到步驟 */}
                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-blue-600 mb-3 uppercase tracking-wider">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" /> 簽到步驟
                  </h4>
                  <div className="space-y-4 text-slate-600">
                    <div className="flex gap-3 text-left">
                      <span className="flex-none w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                      <p className="text-sm font-bold leading-relaxed">選擇定觀地點。或是使用自由定點模式。</p>
                    </div>
                    <div className="flex gap-3 text-left">
                      <span className="flex-none w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                      <p className="text-sm font-bold leading-relaxed">確認 GPS 定位在樣點 1 公里內。</p>
                    </div>
                  </div>
                </section>

                {/* 修改後的「將系統加入桌面」排版 */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-slate-400" size={18} />
                    <h4 className="text-sm font-black text-slate-800 tracking-wide">將系統加入桌面</h4>
                  </div>
                  
                  <div className="space-y-2.5">
                    {/* iOS 卡片 */}
                    <div className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Apple size={20} className="group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-bold tracking-tight">iOS Safari</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-xs font-medium">分享</span>
                        <ChevronRight size={12} className="opacity-50" />
                        <span className="text-xs font-bold text-slate-500">加入主畫面</span>
                      </div>
                    </div>

                    {/* Android 卡片 */}
                    <div className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Bot size={20} className="group-hover:text-orange-500 transition-colors" />
                        <span className="text-sm font-bold tracking-tight">Android Chrome</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-xs font-medium">選單</span>
                        <ChevronRight size={12} className="opacity-50" />
                        <span className="text-xs font-bold text-slate-500">安裝應用程式</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 聯絡資訊 */}
                <footer className="pt-2 pb-4 text-center border-t border-slate-50">
                  <p className="text-[10px] text-slate-300 font-bold mb-2 uppercase tracking-tight mt-6">遇到系統問題？請聯繫資訊志工</p>
                  <a href="mailto:episil@gmail.com" className="inline-flex items-center gap-2 text-blue-500 font-black text-sm hover:opacity-70 transition-opacity">
                    <Mail size={14} /> episil@gmail.com
                  </a>
                </footer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 簽到主視圖內容 (其餘部分保持不變) */}
      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-black text-green-700 mb-2">簽到成功！</h3>
          <p className="text-green-600/70 text-sm font-bold">{selectedLocation}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Navigation className="text-blue-600" size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 leading-none">定觀簽到</h2>
                <p className="text-slate-400 text-xs mt-1.5 font-bold">{profile.branch} · {profile.volunteer_group}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              <HelpCircle size={22} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">選擇今日定觀點</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 appearance-none disabled:opacity-50"
                >
                  <option value="">{isLoading ? '地點讀取中...' : '-- 請選擇地點 --'}</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc.location_name}>{loc.location_name}</option>
                  ))}
                  <option value="自由定點">📍 自由定點 (不受 GPS 限制)</option>
                </select>
              </div>
              
              {selectedLocation && selectedLocation !== '自由定點' && (
                <div className="mt-3 px-4 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">距離樣點</span>
                  {distance !== null ? (
                    <span className={`text-xs font-black ${distance > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {distance < 1 ? `約 ${(distance * 1000).toFixed(0)} 公尺` : `約 ${distance.toFixed(2)} 公里`}
                      {distance > 1 && " (超出範圍)"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="animate-spin text-slate-300" size={12} />
                      <span className="text-[10px] text-slate-300 font-bold">定位中...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">簽到日期</label>
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-2xl text-slate-400">
                <Calendar size={18} />
                <span className="text-sm font-bold">{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <button
              onClick={handleCheckin}
              disabled={isCheckinDisabled}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !isCheckinDisabled ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : '確認簽到'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
