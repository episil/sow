'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Camera, MapPin, Send, Loader2, Sparkles, Navigation, 
  MessageCircle, CheckCircle2, Heart, User, Users 
} from 'lucide-react';
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
  
  const [reports, setReports] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

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

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('species_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const formattedData = (data || []).map(r => ({
        ...r,
        likes_count_species: r.likes_count_species ?? 0 // 修改為新欄位名稱
      }));
      setReports(formattedData);
    } catch (err) {
      console.error('抓取情報失敗:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => { 
    getGPSLocation(); 
    fetchReports();

    const channel = supabase
      .channel('species_reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'species_reports' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newReport = { 
            ...payload.new, 
            likes_count_species: payload.new.likes_count_species ?? 0 
          };
          setReports(prev => [newReport, ...prev].slice(0, 20));
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => 
            r.id === payload.new.id 
              ? { 
                  ...r,           // 保留原本前端的資料
                  ...payload.new, // 用新的資料覆蓋
                  // 防止歸零邏輯：如果更新 payload 沒帶讚數，則保留舊數值
                  likes_count_species: payload.new.likes_count_species ?? r.likes_count_species ?? 0 
                } 
              : r
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  const handleLike = async (id) => {
    let previousReports;
    setReports(prev => {
      previousReports = prev; 
      return prev.map(r => 
        r.id === id ? { ...r, likes_count_species: (r.likes_count_species || 0) + 1 } : r
      );
    });

    try {
      // 這裡呼叫的是 SQL 中的 RPC 函數，請確保函數內容也同步修改了欄位名
      const { error } = await supabase.rpc('increment_species_likes', { row_id: id });
      if (error) throw error;
    } catch (err) {
      console.error('點讚失敗:', err.message);
      setReports(previousReports);
    }
  };

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
          display_name: profile.nature_name || profile.full_name || '夥伴',
          species_name: speciesName,
          description: description,
          image_url: publicUrl,
          latitude: location.lat,
          longitude: location.lng,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group,
          likes_count_species: 0 // 修改為新欄位名稱
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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* 標題區塊 */}
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Camera className="text-blue-500" /> 物種情報站
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          GPS Species Intelligence Report
        </p>
      </div>

      {/* 表單區塊 */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <PhotoUpload 
          onImageProcessed={(file) => setPhotoFile(file)} 
          onLocationExtracted={(coords) => {
            setLocation({ lat: coords.lat, lng: coords.lng });
            setGpsSource('photo');
            setTimeout(() => setGpsSource('browser'), 5000);
          }}
          clearTrigger={status === 'success'} 
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-500 ${gpsSource === 'photo' ? 'bg-emerald-50 ring-2 ring-emerald-100' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${gpsSource === 'photo' ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                <MapPin size={20} />
              </div>
              <div className="text-xs font-bold text-slate-600">
                {isLocating ? '定位中...' : location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '未獲取位置'}
              </div>
            </div>
            <button type="button" onClick={getGPSLocation} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors">
              <Navigation size={18} />
            </button>
          </div>

          <input
            type="text"
            value={speciesName}
            onChange={(e) => setSpeciesName(e.target.value)}
            placeholder="物種名稱（例：人面蜘蛛）"
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="分享此刻的驚喜..."
            rows={3}
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 resize-none"
          />

          <button
            type="submit"
            disabled={!photoFile || !speciesName || isSubmitting}
            className={`w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
              photoFile && speciesName && !isSubmitting ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 active:scale-95' : 'bg-slate-100 text-slate-300'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : status === 'success' ? <Sparkles size={20} /> : <><Send size={18} />發佈情報</>}
          </button>
        </form>
      </div>

      {/* 列表區塊 */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black text-slate-500 px-4 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} /> 最新物種情報
        </h3>

        {isLoadingList ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid gap-6">
            {reports.map((item) => (
              <div key={item.id} className="bg-white border border-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm relative animate-in slide-in-from-bottom-4 duration-500">
                {/* 右上角按讚按鈕 */}
                <button 
                  onClick={() => handleLike(item.id)}
                  className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 active:scale-90 transition-all"
                >
                  <Heart size={14} className={`${(item.likes_count_species > 0) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                  <span className={`text-xs font-black ${(item.likes_count_species > 0) ? 'text-red-500' : 'text-slate-400'}`}>
                    {item.likes_count_species}
                  </span>
                </button>

                {item.image_url && (
                  <div className="w-full h-48">
                    <img src={item.image_url} alt={item.species_name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-black">
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{item.branch || '荒野'}</span>
                    <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{item.volunteer_group || '夥伴'}</span>
                    <span className="text-slate-700 flex items-center gap-1 ml-1"><User size={10} className="text-slate-400" />{item.display_name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-black text-slate-800">{item.species_name}</h4>
                    {item.latitude && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <MapPin size={10} />
                        <span>座標已記錄</span>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-slate-600 text-sm font-bold bg-slate-50 p-4 rounded-2xl leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
