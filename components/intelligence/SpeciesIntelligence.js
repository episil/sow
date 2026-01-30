'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, MapPin, Send, Loader2, Sparkles, Navigation, MessageCircle, CheckCircle2 } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

export default function SpeciesIntelligence({ profile }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [speciesName, setSpeciesName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [gpsSource, setGpsSource] = useState('browser');

  const getGPSLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    setGpsSource('browser');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS 獲取失敗", err);
        setIsLocating(false);
      }
    );
  };

  useEffect(() => { getGPSLocation(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id || !photoFile || !speciesName) return;

    setIsSubmitting(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('species-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('species-photos')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('species_reports')
        .insert([{
          user_id: profile.id,
          species_name: speciesName,
          description: description,
          image_url: publicUrl,
          latitude: location.lat,
          longitude: location.lng,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group
        }]);

      if (dbError) throw dbError;

      setStatus('success');
      setPhotoFile(null);
      setSpeciesName('');
      setDescription('');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error("上傳過程出錯:", err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Camera className="text-blue-500" /> 物種情報站
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          GPS Species Intelligence Report
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        
        {/* 1. 照片上傳區塊 */}
        <div className="relative group">
          <PhotoUpload 
            onImageProcessed={(file) => setPhotoFile(file)} 
            onLocationExtracted={(coords) => {
              setLocation({ lat: coords.lat, lng: coords.lng });
              setGpsSource('photo');
              setTimeout(() => setGpsSource('browser'), 5000);
            }}
            clearTrigger={status === 'success'} 
          />
          
          {/* 中間偏下方的簡潔提示標籤 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-full flex justify-center">
            <span className="text-[10px] font-black text-slate-400 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-100/50 shadow-sm tracking-tighter">
              自動導入照片 GPS 座標
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 2. 座標顯示區塊 */}
          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-500 ${gpsSource === 'photo' ? 'bg-emerald-50 ring-2 ring-emerald-100' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${gpsSource === 'photo' ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                <MapPin size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">目前定位座標</span>
                  {gpsSource === 'photo' && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                      <CheckCircle2 size={10} /> 照片位置已匯入
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-600">
                  {isLocating ? '定位中...' : location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '未獲取位置'}
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={getGPSLocation}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Navigation size={18} />
            </button>
          </div>

          {/* 3. 物種名稱 */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 px-2 uppercase tracking-tighter">發現物種名稱</label>
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              placeholder="輸入物種名稱（例：人面蜘蛛）"
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          {/* 4. 心情分享 */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 px-2 uppercase tracking-tighter flex items-center gap-1">
              <MessageCircle size={12} /> 發現心情分享
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享一下此刻的驚喜或發現故事吧..."
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>

          {/* 5. 提交按鈕 */}
          <button
            type="submit"
            disabled={!photoFile || !speciesName || isSubmitting}
            className={`w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
              photoFile && speciesName && !isSubmitting
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 active:scale-95'
                : 'bg-slate-100 text-slate-300'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : status === 'success' ? (
              <Sparkles size={20} className="text-yellow-300" />
            ) : (
              <>
                <Send size={18} />
                發佈回報情報
              </>
            )}
            {status === 'success' ? '情報上傳成功！' : isSubmitting ? '處理中...' : ''}
          </button>
        </form>
      </div>

      {status === 'error' && (
        <div className="text-center text-red-500 text-xs font-bold animate-bounce">
          上傳失敗，請檢查網路連線或稍後再試。
        </div>
      )}
    </div>
  );
}
