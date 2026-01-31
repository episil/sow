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
  Share,
  MoreVertical,
  Mail,
  Edit3,
  MapPinned,
  PlusSquare
} from 'lucide-react';

export default function CheckinView({ profile }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showHelp, setShowHelp] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    if (!selectedLocation || selectedLocation === '自由定點') {
      setDistance(null);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedLocation]);

  useEffect(() => {
    if (userCoords && selectedLocation && selectedLocation !== '自由定點') {
      const targetLoc = locations.find(l => l.location_name === selectedLocation);
      if (targetLoc?.latitude) {
        const d = calculateDistance(userCoords.lat, userCoords.lng, targetLoc.latitude, targetLoc.longitude);
        setDistance(d);
      }
    }
  }, [userCoords, selectedLocation, locations]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const isCheckinDisabled = 
    !selectedLocation || 
    isSubmitting || 
    (selectedLocation === '自由定點' && !customLocation.trim()) || 
    (selectedLocation !== '自由定點' && (distance === null || distance > 1));

  const handleCheckin = async () => {
    setIsSubmitting(true);
    const finalLocationName = selectedLocation === '自由定點' 
      ? `${customLocation.trim()}(自由定點)` 
      : selectedLocation;

    try {
      const { error } = await supabase.from('checkin_records').insert([{
        user_id: profile.id,
        location_name: finalLocationName,
        branch: profile.branch,
        volunteer_group: profile.volunteer_group
      }]);
      if (error) throw error;
      
      setCustomLocation(finalLocationName); 
      setStatus('success');
      
      setTimeout(() => { 
        setStatus('idle'); 
        setSelectedLocation(''); 
        setCustomLocation(''); 
        setDistance(null); 
      }, 3000);
    } catch (error) {
      alert('簽到失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative text-left">
      
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
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-blue-600 mb-3 uppercase tracking-wider">
                    <MapPinned size={14} /> 簽到步驟
                  </h4>
                  <div className="space-y-3">
                    {[
                      { s: "1", t: "選擇定觀地點（或自由定點）。", d: "自由定點：不受 GPS 距離限制，供特殊情況使用。" },
                      { s: "2", t: "開啟 GPS 定位，確認在樣點 1公里 內。" },
                      { s: "3", t: "填妥資料後點擊確認簽到即完成。" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex-none w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{item.s}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{item.t}</p>
                          {item.d && <p className="text-[11px] text-slate-400 mt-0.5">{item.d}</p>}
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-orange-500 font-bold pl-8 mt-2">服勤提醒：定觀半天，依荒野規定服勤時間為一小時。</p>
                  </div>
                </section>

                {/* 常見問題 */}
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-blue-600 mb-3 uppercase tracking-wider">
                    <HelpCircle size={14} /> 常見問題 Q&A
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                    <div>
                      <p className="text-xs font-black text-slate-700 mb-1.5 text-blue-600">Q: 如何在瀏覽器開啟 GPS 定位？</p>
                      <ul className="text-[11px] text-slate-500 space-y-1 ml-1 font-medium">
                        <li>• Android：Chrome 設定 ➜ 網站設定 ➜ 位置 ➜ 開啟。</li>
                        <li>• iOS：系統設定 ➜ 隱私權 ➜ 定位服務 ➜ 允許瀏覽器使用。</li>
                        <li>• 電腦版：點擊網址列左側鎖頭 ➜ 位置 ➜ 允許。</li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-black text-slate-700 mb-1 text-blue-600">Q: 出現「Application error」？</p>
                      <p className="text-[11px] text-slate-500 font-medium">A: 請刪除瀏覽紀錄或開啟無痕模式重新瀏覽。</p>
                    </div>
                  </div>
                </section>

                {/* 加入桌面 */}
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-blue-600 mb-3 uppercase tracking-wider">
                    <Smartphone size={14} /> 將系統加入桌面
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 mb-1">iOS Safari</p>
                      <p className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1"><Share size={12}/> 分享 ➜ 加入主畫面</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 mb-1">Android Chrome</p>
                      <p className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1"><PlusSquare size={12}/> 選單 ➜ 安裝程式</p>
                    </div>
                  </div>
                </section>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold mb-4 flex items-center justify-center gap-2">
                    <Mail size={12} /> 系統問題？ episil@gmail.com
                  </p>
                  <button onClick={() => setShowHelp(false)} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100">
                    開始使用系統
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-black text-green-700 mb-2">簽到成功！</h3>
          <p className="text-green-600/70 text-sm font-bold">{selectedLocation === '自由定點' ? customLocation : selectedLocation}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Navigation className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-none">定觀、出席、值勤簽到</h2>
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
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">選擇今日定觀點</label>
              <div className="relative mb-4">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCustomLocation(''); 
                  }}
                  disabled={isLoading || isSubmitting}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 appearance-none disabled:opacity-50"
                >
                  <option value="">{isLoading ? '地點讀取中...' : '-- 請選擇地點 --'}</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc.location_name}>{loc.location_name}</option>
                  ))}
                  <option value="自由定點">📍 自由定點 (不限距離)</option>
                </select>
              </div>

              {selectedLocation === '自由定點' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Edit3 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                    <input 
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="請輸入定觀地點名稱"
                      className="w-full pl-12 pr-4 py-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-0 focus:border-orange-200"
                    />
                  </div>
                  <p className="mt-2 ml-2 text-[10px] font-bold text-orange-500">※ 系統將在名稱後自動標註 (自由定點)。</p>
                </div>
              )}
              
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

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">簽到日期與時間</label>
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-2xl text-slate-500">
                <Calendar size={18} />
                <span className="text-sm font-bold">
                  {currentTime.toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false 
                  })}
                </span>
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
