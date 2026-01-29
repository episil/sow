'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Camera, MapPin, Send, Loader2, Leaf, Info, Navigation2 } from 'lucide-react';

export default function SpeciesIntelligence({ profile }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [formData, setFormData] = useState({
    species_name: '',
    description: '',
    gps_location: '',
    image_file: null,
    image_preview: null
  });

  // 1. 自動取得 GPS 座標
  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援定位功能");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // 格式化為 "緯度, 經度"
        setFormData(prev => ({ ...prev, gps_location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        setIsLocating(false);
      },
      (error) => {
        alert("無法取得位置，請確認是否開啟 GPS 權限");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // 2. 處理照片選擇與預覽
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image_file: file,
        image_preview: URL.createObjectURL(file)
      }));
    }
  };

  // 3. 提交情報（包含壓縮與上傳）
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_file || !formData.species_name) return;

    setIsSubmitting(true);

    try {
      // A. 圖片壓縮設定
      const options = {
        maxSizeMB: 0.2, // 限制 200KB 左右
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(formData.image_file, options);
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;

      // B. 上傳至 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('species_photos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // 取得公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('species_photos')
        .getPublicUrl(fileName);

      // C. 寫入資料庫記錄
      const { error: dbError } = await supabase
        .from('species_reports')
        .insert([{
          user_id: profile.id,
          species_name: formData.species_name,
          description: formData.description,
          gps_location: formData.gps_location,
          image_url: publicUrl,
          // 帶入志工身分快照
          reporter_nature_name: profile.nature_name || profile.full_name,
          reporter_branch: profile.branch,
          reporter_group: profile.volunteer_group
        }]);

      if (dbError) throw dbError;

      alert('情報發佈成功！');
      // 重設表單
      setFormData({ species_name: '', description: '', gps_location: '', image_file: null, image_preview: null });

    } catch (error) {
      console.error('發佈失敗:', error);
      alert('發佈失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
          <Camera className="text-green-600" size={24} />
        </div>
        <div className="text-left">
          <h2 className="text-lg font-black text-slate-800 leading-none">物種即時情報站</h2>
          <p className="text-slate-400 text-xs mt-1.5 font-bold">
            觀察者：{profile.nature_name || profile.full_name} ({profile.branch})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 照片上傳區域 */}
        <div className="relative group">
          <input 
            type="file" accept="image/*" capture="environment" 
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className={`aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
            formData.image_preview ? 'border-green-500 bg-white' : 'border-slate-200 bg-slate-50'
          }`}>
            {formData.image_preview ? (
              <img src={formData.image_preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={32} className="text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-400">點擊拍攝或上傳照片</span>
              </>
            )}
          </div>
        </div>

        {/* 物種名稱 */}
        <div className="text-left">
          <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">發現了什麼？</label>
          <div className="relative">
            <Leaf size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text" required placeholder="物種名稱 (例如: 斯文豪氏赤蛙)"
              value={formData.species_name}
              onChange={e => setFormData({...formData, species_name: e.target.value})}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>
        </div>

        {/* GPS 座標 */}
        <div className="text-left">
          <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">在哪發現？ (GPS)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text" placeholder="座標位置" readOnly
                value={formData.gps_location}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-xs font-mono text-slate-500"
              />
            </div>
            <button
              type="button" onClick={handleGetLocation} disabled={isLocating}
              className="px-4 bg-white border border-slate-200 rounded-2xl text-blue-600 active:scale-95 transition-all flex items-center justify-center"
            >
              {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Navigation2 size={18} />}
            </button>
          </div>
        </div>

        {/* 詳細描述 */}
        <div className="text-left">
          <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">觀察紀錄</label>
          <div className="relative">
            <Info size={16} className="absolute left-4 top-4 text-slate-300" />
            <textarea
              placeholder="描述一下發現的細節..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full pl-11 pr-4 py-3.5 h-24 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-100 transition-all resize-none"
            />
          </div>
        </div>

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.image_file || !formData.species_name}
          className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
            formData.image_file && formData.species_name && !isSubmitting
              ? 'bg-green-600 text-white shadow-lg shadow-green-100 active:scale-95'
              : 'bg-slate-100 text-slate-300'
          }`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> 發佈情報</>}
        </button>
      </form>
    </div>
  );
}
