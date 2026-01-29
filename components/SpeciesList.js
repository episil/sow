'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, MapPin, User, Calendar, Flame, ChevronRight } from 'lucide-react';

export default function SpeciesList({ currentBranch }) {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchObservations = async () => {
      setIsLoading(true);
      try {
        // 抓取最近 10 筆觀察紀錄
        // 優先過濾同分會的資料，讓志工更有感
        let query = supabase
          .from('observations')
          .select(`
            *,
            profiles:user_id (nature_name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (currentBranch) {
          // 您可以選擇是否只顯示同分會，或者全台灣混合顯示
          // 這裡建議全台混合，但顯示分會標籤
        }

        const { data, error } = await query;
        if (error) throw error;
        setObservations(data || []);
      } catch (error) {
        console.error('抓取觀察紀錄失敗:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchObservations();
  }, [currentBranch]);

  if (isLoading) {
    return (
      <div className="w-full py-8 flex items-center justify-center gap-2 text-slate-300">
        <Flame className="animate-pulse" size={20} />
        <span className="text-xs font-bold tracking-widest">探索荒野動態中...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
            <Flame className="text-orange-500" size={18} />
          </div>
          <h3 className="font-black text-slate-700">最新發現</h3>
        </div>
        <button className="text-[10px] font-black text-blue-500 flex items-center gap-1 uppercase tracking-tighter">
          查看全部 <ChevronRight size={14} />
        </button>
      </div>

      {/* 橫向滑動區域 */}
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-2 px-2">
        {observations.map((item) => (
          <div 
            key={item.id} 
            className="flex-shrink-0 w-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group active:scale-95 transition-all"
          >
            {/* 照片區域 */}
            <div className="relative h-40 bg-slate-100">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.species_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={32} />
                </div>
              )}
              {/* 分會標籤 */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                <p className="text-[10px] font-black text-slate-600">{item.branch}</p>
              </div>
            </div>

            {/* 內容區域 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{item.species_name}</h4>
                  <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                    <MapPin size={10} />
                    <span className="text-[10px] font-bold">{item.location_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                    <User size={10} className="text-blue-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500">
                    {item.profiles?.nature_name || '荒野夥伴'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Calendar size={10} />
                  <span className="text-[10px] font-bold">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 最後一張佔位卡片：引導上傳 */}
        <div className="flex-shrink-0 w-48 bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-100 flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:bg-blue-50 transition-all">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
            <Camera className="text-blue-500" size={24} />
          </div>
          <p className="text-xs font-black text-blue-600 mb-1">分享您的發現</p>
          <p className="text-[10px] text-blue-400 font-bold leading-tight">讓大家看見今天的定觀驚喜</p>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
