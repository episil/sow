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
      // 確保抓取到的資料 likes_count 至少為 0
      const formattedData = (data || []).map(r => ({
        ...r,
        likes_count: r.likes_count ?? 0
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
          const newReport = { ...payload.new, likes_count: payload.new.likes_count ?? 0 };
          setReports(prev => [newReport, ...prev].slice(0, 20));
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => 
            r.id === payload.new.id 
              ? { ...payload.new, likes_count: payload.new.likes_count ?? 0 } 
              : r
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchReports]);

  // 修復：強化樂觀更新，解決「瞬間歸零」
  const handleLike = async (id) => {
    let previousReports;
    
    // 1. 立即更新 UI（樂觀更新）
    setReports(prev => {
      previousReports = prev; 
      return prev.map(r => 
        r.id === id ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
      );
    });

    try {
      // 2. 呼叫後端
      const { error } = await supabase.rpc('increment_species_likes', { row_id: id });
      
      if (error) {
        // 如果報錯是關於 Candidate 函數，通常是型別問題
        throw error;
      }
    } catch (err) {
      console.error('點讚失敗:', err.message);
      // 3. 失敗時恢復舊數據
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
          likes_count: 0
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
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Camera className="text-blue-500" /> 物種情報站
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          GPS Species Intelligence Report
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
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
        </div>

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
            <button type="button" onClick={getGPSLocation} className="p-2 text-blue-500">
              <Navigation size={18} />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              placeholder="物種名稱（例：人面蜘蛛）"
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享此刻的驚喜..."
              rows={3}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!photoFile || !speciesName || isSubmitting}
            className={`w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
              photoFile && speciesName && !isSubmitting ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-300'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : status === 'success' ? <Sparkles size={20} /> : <><Send size={18} />發佈情報</>}
          </button>
        </form>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black text-slate-500 px-4 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} /> 最新物種情報
        </h3>

        {isLoadingList ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid gap-6">
            {reports.map((item) => (
              <div key={item.id} className="bg-white border border-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm relative">
                <button 
                  onClick={() => handleLike(item.id)}
                  className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 active:scale-90"
                >
                  <Heart size={14} className={`${(item.likes_count > 0) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                  <span className={`text-xs font-black ${(item.likes_count > 0) ? 'text-red-500' : 'text-slate-400'}`}>
                    {item.likes_count}
                  </span>
                </button>

                {item.image_url && (
                  <div className="w-full h-48">
                    <img src={item.image_url} alt={item.species_name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-black">
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.branch}</span>
                    <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{item.volunteer_group}</span>
                    <span className="text-slate-700 flex items-center gap-1"><User size={10} />{item.display_name}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800">{item.species_name}</h4>
                  {item.description && (
                    <p className="text-slate-600 text-sm font-bold bg-slate-50 p-4 rounded-2xl">{item.description}</p>
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
