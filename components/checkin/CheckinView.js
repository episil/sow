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
  AlertCircle 
} from 'lucide-react';

export default function CheckinView({ profile }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showHelp, setShowHelp] = useState(false);
  
  // 新增：存儲當前 GPS 與計算後的距離
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  // 1. 抓取地點清單
  useEffect(() => {
    const fetchBranchLocations = async () => {
      if (!profile?.branch) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('location_name, latitude, longitude')
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

  // 2. 實時取得用戶位置
  useEffect(() => {
    if (!selectedLocation || selectedLocation === '自由定點') {
      setDistance(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error("定位錯誤:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedLocation]);

  // 3. 當位置或選擇的地點改變時，重新計算距離
  useEffect(() => {
    if (userCoords && selectedLocation && selectedLocation !== '自由定點') {
      const targetLoc = locations.find(l => l.location_name === selectedLocation);
      if (targetLoc?.latitude && targetLoc?.longitude) {
        const d = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          targetLoc.latitude,
          targetLoc.longitude
        );
        setDistance(d);
      }
    } else {
      setDistance(null);
    }
  }, [userCoords, selectedLocation, locations]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 判斷按鈕是否可用：必須選地點，且(是自由定點 OR 距離在1km內)
  const isCheckinDisabled = 
    !selectedLocation || 
    isSubmitting || 
    (selectedLocation !== '自由定點' && (distance === null || distance > 1));

  const handleCheckin = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('checkin_records')
        .insert([{
          user_id: profile.id,
          location_name: selectedLocation,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group
        }]);

      if (error) throw error;
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setSelectedLocation('');
        setDistance(null);
      }, 3000);
    } catch (error) {
      alert('簽到失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
      {/* 幫助說明彈窗內容保持不變 */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-white p-6 overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
              <Info className="text-blue-500" size={20} /> 使用說明
            </h3>
            <button onClick={() => setShowHelp(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-6 text-sm text-slate-600 font-bold leading-relaxed">
             {/* 此處略，保持您原始提供的說明文字內容 */}
             <p>1. 選擇定觀地點。 (自由定點：不受 GPS 距離限制)</p>
             <p>2. 確認在樣點 1公里 內。</p>
             <p>3. 點擊確認簽到即完成。</p>
          </div>
        </div>
      )}

      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-black text-green-700 mb-2">簽到成功！</h3>
          <p className="text-green-600/70 text-sm font-bold">{selectedLocation}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Navigation className="text-blue-600" size={24} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 leading-none">定觀簽到</h2>
                <p className="text-slate-400 text-xs mt-1.5 font-bold">{profile.branch} · {profile.volunteer_group}</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(true)} className="p-3 text-slate-300 hover:text-blue-500 transition-colors">
              <HelpCircle size={24} />
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 appearance-none disabled:opacity-50"
                >
                  <option value="">{isLoading ? '地點讀取中...' : '-- 請選擇地點 --'}</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc.location_name}>{loc.location_name}</option>
                  ))}
                  <option value="自由定點">📍 自由定點 (不受 GPS 限制)</option>
                </select>
              </div>

              {/* 距離顯示區塊 */}
              {selectedLocation && selectedLocation !== '自由定點' && (
                <div className="mt-3 px-4 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400">目前距離：</span>
                  {distance !== null ? (
                    <span className={`text-xs font-black ${distance > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {distance < 1 ? `約 ${(distance * 1000).toFixed(0)} 公尺` : `約 ${distance.toFixed(2)} 公里`}
                      {distance > 1 && " (超出範圍)"}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300 animate-pulse font-bold">定位獲取中...</span>
                  )}
                </div>
              )}
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
