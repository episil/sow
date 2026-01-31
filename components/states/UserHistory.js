'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  MapPin, 
  Download, 
  ChevronLeft, 
  Search,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

export default function UserHistory({ onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0]
  });

  // 1. 抓取簽到紀錄
  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('checkins')
      .select(`
        created_at,
        location_name,
        location_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dateRange.start) {
      query = query.gte('created_at', `${dateRange.start}T00:00:00`);
    }
    if (dateRange.end) {
      query = query.lte('created_at', `${dateRange.end}T23:59:59`);
    }

    const { data, error } = await query;
    if (!error) setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 2. 匯出 CSV 功能
  const exportToCSV = () => {
    if (history.length === 0) {
      alert("目前沒有資料可供匯出");
      return;
    }

    // 設定 CSV 標頭
    const headers = ["日期", "時間", "簽到地點"];
    const rows = history.map(item => {
      const dateObj = new Date(item.created_at);
      return [
        dateObj.toLocaleDateString('zh-TW'),
        dateObj.toLocaleTimeString('zh-TW', { hour12: false }),
        item.location_name
      ];
    });

    // 加入 BOM 確保 Excel 開啟不編碼錯誤 (中文字顯示正常)
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `荒野足跡_${dateRange.start || '全部'}_至_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 animate-in fade-in duration-500">
      {/* 標題列 */}
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-800">我的足跡</h1>
      </header>

      {/* 篩選與匯出區 */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">起始日期</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">結束日期</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchHistory}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Search size={18} /> 篩選紀錄
          </button>
          <button 
            onClick={exportToCSV}
            className="flex-1 bg-slate-800 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Download size={18} /> 匯出 CSV
          </button>
        </div>
      </div>

      {/* 列表顯示 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-bold">讀取中...</div>
        ) : history.length > 0 ? (
          history.map((item, index) => (
            <div key={index} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{item.location_name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[2.5rem] p-10 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">此區間尚無簽到記錄</p>
          </div>
        )}
      </div>
    </div>
  );
}
