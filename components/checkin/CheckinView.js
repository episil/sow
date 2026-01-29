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
        // 加入自由定點選項
        setLocations(data || []);
      } catch (error) {
        console.error('抓取地點失敗:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranchLocations();
  }, [profile]);

  // GPS 距離計算邏輯 (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半徑 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 2. 執行簽到動作
  const handleCheckin = async () => {
    if (!selectedLocation) return;
    
    setIsSubmitting(true);

    // 如果不是「自由定點」，則執行 GPS 檢查
    if (selectedLocation !== '自由定點') {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          });
        });

        const targetLoc = locations.find(l => l.location_name === selectedLocation);
        if (targetLoc && targetLoc.latitude && targetLoc.longitude) {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            targetLoc.latitude,
            targetLoc.longitude
          );

          if (distance > 1) {
            alert(`簽到失敗：您目前距離樣點約 ${distance.toFixed(1)} 公里，請進入 1 公里範圍內再試。若有特殊情況請選擇「自由定點」。`);
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        alert('無法取得您的位置，請確認瀏覽器已開啟定位權限。');
        setIsSubmitting(false);
        return;
      }
    }

    // 儲存記錄
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
      }, 3000);
    } catch (error) {
      alert('簽到失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
      {/* 幫助說明彈窗 */}
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
          
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <section>
              <h4 className="font-black text-blue-600 mb-2">簽到步驟</h4>
              <ol className="list-decimal ml-4 space-y-2 font-bold">
                <li>選擇定觀地點。 (自由定點：不受 GPS 距離限制)</li>
                <li>開啟 GPS 定位，確認在樣點 1 公里內。</li>
                <li>點擊確認簽到即完成。</li>
              </ol>
              <div className="mt-3 p-3 bg-blue-50 rounded-xl text-[11px] text-blue-700 font-bold border border-blue-100">
                服勤提醒：定觀半天，依荒野規定服勤時間為一小時。
              </div>
            </section>

            <section>
              <h4 className="font-black text-slate-800 mb-2 flex items-center gap-1"><Smartphone size={16}/> 常見問題 Q&A</h4>
              <div className="space-y-3 font-bold text-xs">
                <p className="text-blue-700 underline">如何開啟 GPS 定位？</p>
                <ul className="list-disc ml-4 opacity-80">
                  <li>Android：設定 ➜ 網站設定 ➜ 位置 ➜ 開啟。</li>
                  <li>iOS：系統設定 ➜ 隱私權 ➜ 定位服務 ➜ 允許。</li>
                </ul>
                <p className="text-red-500 underline mt-2">出現「Application error」？</p>
                <p className="opacity-80">請刪除瀏覽紀錄或開啟無痕模式重新瀏覽。</p>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-100">
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統問題請聯繫資訊志工</p>
                <a href="mailto:episil@gmail.com" className="text-blue-500 font-black">episil@gmail.com</a>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 正常視圖 */}
      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center justify-center animate-in zoom-in duration-300">
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
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-none">定觀簽到</h2>
                <p className="text-slate-400 text-xs mt-1.5 font-bold">{profile.branch} · {profile.volunteer_group}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="p-3 text-slate-300 hover:text-blue-500 transition-colors"
            >
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
              disabled={!selectedLocation || isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                selectedLocation && !isSubmitting ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'
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
