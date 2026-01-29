'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // 假設您已依建議結構建立此檔案
import { MapPin, Calendar, CheckCircle2, Loader2, Navigation } from 'lucide-react';

export default function CheckinView({ profile }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success

  // 1. 根據志工所屬分會，自動抓取該分會的定觀點清單
  useEffect(() => {
    const fetchBranchLocations = async () => {
      if (!profile?.branch) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('location_name')
          .eq('branch', profile.branch)
          .order('location_name', { ascending: true });

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('抓取地點失敗:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranchLocations();
  }, [profile]);

  // 2. 執行簽到動作
  const handleCheckin = async () => {
    if (!selectedLocation) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('checkin_records')
        .insert([{
          user_id: profile.id,
          location_name: selectedLocation,
          branch: profile.branch,           // 備份當下分會
          volunteer_group: profile.volunteer_group // 備份當下組別
        }]);

      if (error) throw error;

      setStatus('success');
      // 3秒後恢復初始狀態
      setTimeout(() => {
        setStatus('idle');
        setSelectedLocation('');
      }, 3000);

    } catch (error) {
      alert('簽到失敗，請檢查網路連線：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full bg-green-50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
          <CheckCircle2 className="text-white" size={40} />
        </div>
        <h3 className="text-xl font-black text-green-700 mb-2">簽到成功！</h3>
        <p className="text-green-600/70 text-sm font-bold">{selectedLocation}</p>
        <p className="text-green-600/50 text-xs mt-4">紀錄已存入您的貢獻度中</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Navigation className="text-blue-600" size={24} />
        </div>
        <div className="text-left">
          <h2 className="text-lg font-black text-slate-800 leading-none">定觀簽到</h2>
          <p className="text-slate-400 text-xs mt-1.5 font-bold">
            {profile.branch} · {profile.volunteer_group}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 地點選擇 */}
        <div className="text-left">
          <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">
            選擇今日定觀點
          </label>
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              disabled={isLoading || isSubmitting}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all appearance-none disabled:opacity-50"
            >
              <option value="">{isLoading ? '地點讀取中...' : '-- 請選擇地點 --'}</option>
              {locations.map((loc, index) => (
                <option key={index} value={loc.location_name}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 簽到日期 (僅顯示不可修改) */}
        <div className="text-left">
          <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">
            簽到日期
          </label>
          <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-2xl text-slate-400">
            <Calendar size={18} />
            <span className="text-sm font-bold">{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* 簽到按鈕 */}
        <button
          onClick={handleCheckin}
          disabled={!selectedLocation || isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            selectedLocation && !isSubmitting
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            '確認簽到'
          )}
        </button>
      </div>

      <p className="mt-6 text-[10px] text-slate-300 font-bold text-center">
        溫馨提示：系統會自動根據您的所屬分會過濾地點
      </p>
    </div>
  );
}
