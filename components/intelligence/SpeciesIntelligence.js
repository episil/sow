'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, MapPin, Send, Loader2, Sparkles, Navigation, MessageCircle, Upload } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

export default function SpeciesIntelligence({ profile }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [speciesName, setSpeciesName] = useState('');
  const [description, setDescription] = useState(''); // 新增：心情分享狀態
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // 自動獲取 GPS 位置
  const getGPSLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
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
    if (!photoFile || !speciesName) return;

    setIsSubmitting(true);
    try {
      // 1. 上傳照片至 Supabase Storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('species-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      // 取得公開連結
      const { data: { publicUrl } } = supabase.storage
        .from('species-photos')
        .getPublicUrl(filePath);

      // 2. 寫入資料庫記錄 (species_reports)
      const { error: dbError } = await supabase
        .from('species_reports')
        .insert([{
          user_id: profile.id,
          species_name: speciesName,
          description: description, // 寫入心情分享內容
          image_url: publicUrl,
          latitude: location.lat,
          longitude: location.lng,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group
        }]);

      if (dbError) throw dbError;

      // 3. 成功後重置
      setStatus('success');
      setPhotoFile(null);
      setSpeciesName('');
      setDescription(''); // 清空心情內容
      setTimeout(() => setStatus(null), 3000);

    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Camera className="text-blue-500" /> 物種情報站
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          GPS Species Intelligence Report
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-left">
        
        {/* 修改 1: 將標題改為「上傳照片」並註明「unlimit」 */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 px-2 uppercase tracking-tighter flex justify-between items-center">
            <span>上傳照片</span>
            <span className="text-[10px] text-slate-300">MAX SIZE: UNLIMIT</span>
          </label>
          <PhotoUpload onImageProcessed={(file) => setPhotoFile(file)} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 物種名稱輸入 */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black text-slate-400 px-2 uppercase tracking-tighter text-left">發現物種名稱</label>
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              placeholder="輸入物種名稱（例：人面蜘蛛）"
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all text-left"
              required
            />
          </div>

          {/* 修改 2: 增加心情分享欄位 */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-black text-slate-400 px-2 uppercase tracking-tighter flex items-center gap-1 text-left">
              <MessageCircle size={12} /> 發現心情分享
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享一下此刻的驚喜或發現故事吧..."
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all resize-none text-left"
            />
          </div>

          {/* GPS 座標顯示區 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <MapPin size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">目前定位座標</div>
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

          {/* 提交按鈕 */}
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
