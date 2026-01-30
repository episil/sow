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
  Apple
} from 'lucide-react';

export default function CheckinView({ profile }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showHelp, setShowHelp] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);

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

  const isCheckinDisabled = !selectedLocation || isSubmitting || (selectedLocation !== '自由定點' && (distance === null || distance > 1));

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

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative">
      
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col text-left">
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-left">
                    <Info className="text-blue-600" size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">使用說明</h3>
                </div>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-8 text-left">
                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-blue-600 mb-3 uppercase tracking-wider text-left">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" /> 簽到步驟
                  </h4>
                  <div className="space-y-4 text-slate-600">
                    <div className="flex gap-3 text-left">
                      <span className="flex-none w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                      <p className="text-sm font-bold leading-relaxed text-left">
                        選擇定觀地點（或自由定點）。
                        <span className="block text-xs font-medium text-slate-400 mt-1">自由定點：不受 GPS 距離限制，供特殊情況使用。</span>
                      </p>
                    </div>
                    <div className="flex gap-3 text-left">
                      <span className="flex-none w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                      <p className="text-sm font-bold leading-relaxed text-left">開啟 GPS 定位，確認在樣點 <span className="text-blue-600">1公里</span> 內。</p>
                    </div>
                    <div className="flex gap-3 text-left">
                      <span className="flex-none w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                      <p className="text-sm font-bold leading-relaxed text-left">填妥資料後點擊確認簽到即完成。</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-left">
                      <p className="text-[11px] text-blue-700 font-bold leading-relaxed">服勤提醒：定觀半天，依荒野規定服勤時間為一小時。</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 mb-3 uppercase tracking-wider text-left">
                    <Smartphone size={16} /> 常見問題 Q&A
                  </h4>
                  <div className="space-y-5 text-left">
                    <div>
                      <p className="text-[13px] font-black text-slate-700 mb-2">Q: 如何在瀏覽器開啟 GPS 定位？</p>
                      <ul className="text-xs space-y-1.5 text-slate-500 font-bold ml-1 pl-1">
                        <li>• Android：Chrome 設定 ➜ 網站設定 ➜ 位置 ➜ 開啟</li>
                        <li>• iOS：系統設定 ➜ 隱私權 ➜ 定位服務 ➜ 允許瀏覽器使用</li>
                        <li>• 電腦版：點擊網址列左側鎖頭 ➜ 位置 ➜ 允許</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-red-500 mb-1">Q: 出現「Application error」？</p>
                      <p className="text-xs text-slate-500 font-bold ml-1 pl-1">A: 請刪除瀏覽紀錄或開啟無痕模式重新瀏覽。</p>
                    </div>
                  </div>
                </section>

                {/* 參考圖片重新排版：將系統加入桌面 */}
                <section className="text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="text-green-600" size={16} />
                    <h4 className="text-sm font-black text-slate-800">將系統加入桌面</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {/* iOS Safari */}
                    <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-3">
                        <Share className="text-blue-500" size={16} />
                        <span className="text-sm font-bold text-slate-700">iOS Safari</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <span>分享</span>
                        <span className="text-slate-300">→</span>
                        <span>加入主畫面</span>
                      </div>
                    </div>

                    {/* Android Chrome */}
                    <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-orange-100 transition-all">
                      <div className="flex items-center gap-3">
                        <MoreVertical className="text-orange-500" size={16} />
                        <span className="text-sm font-bold text-slate-700">Android Chrome</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <span>選單</span>
                        <span className="text-slate-300">→</span>
                        <span>安裝應用程式</span>
                      </div>
                    </div>
                  </div>
                </section>

                <footer className="pt-2 pb-4 text-center">
                  <p className="text-[10px] text-slate-300 font-bold mb-2 uppercase tracking-tight">遇到系統問題，請聯繫資訊志工</p>
                  <a href="mailto:episil@gmail.com" className="inline-flex items-center gap-2 text-blue-500 font-black text-sm hover:opacity-70 transition-opacity">
                    <Mail size={14} /> episil@gmail.com
                  </a>
                </footer>
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
          <p className="text-green-600/70 text-sm font-bold">{selectedLocation}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8 text-left">
            <div className="flex items-center gap-3">
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

          <div className="space-y-6 text-left">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest text-left">選擇今日定觀點</label>
              <div className="relative text-left">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 appearance-none disabled:opacity-50 text-left"
                >
                  <option value="">{isLoading ? '地點讀取中...' : '-- 請選擇地點 --'}</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc.location_name}>{loc.location_name}</option>
                  ))}
                  <option value="自由定點">📍 自由定點 (不受 GPS 限制)</option>
                </select>
              </div>
              
              {selectedLocation && selectedLocation !== '自由定點' && (
                <div className="mt-3 px-4 flex justify-between items-center animate-in fade-in slide-in-from-top-1 text-left">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">距離樣點</span>
                  {distance !== null ? (
                    <span className={`text-xs font-black ${distance > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {distance < 1 ? `約 ${(distance * 1000).toFixed(0)} 公尺` : `約 ${distance.toFixed(2)} 公里`}
                      {distance > 1 && " (超出範圍)"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-left">
                      <Loader2 className="animate-spin text-slate-300" size={12} />
                      <span className="text-[10px] text-slate-300 font-bold">定位中...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest text-left">簽到日期</label>
              <div className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-2xl text-slate-400 text-left">
                <Calendar size={18} />
                <span className="text-sm font-bold text-left">{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
