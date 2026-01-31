'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Trophy, Flame, Calendar, MousePointer2, Loader2 } from 'lucide-react';

export default function UserStats({ profile }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, streak: 0 });

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!profile?.id) return;

      try {
        // 1. 從我們定義的 SQL View 抓取每日統計
        const { data, error } = await supabase
          .from('daily_contributions')
          .select('contribution_date, activity_count')
          .eq('user_id', profile.id);

        if (error) throw error;

        // 格式化資料以符合 Heatmap 要求 (date, count)
        const formattedData = data.map(item => ({
          date: item.contribution_date,
          count: item.activity_count
        }));

        setStats(formattedData);

        // 2. 計算總貢獻與目前的連擊數 (Streak)
        const total = formattedData.reduce((acc, curr) => acc + curr.count, 0);
        setSummary({ total, streak: calculateStreak(formattedData) });

      } catch (error) {
        console.error('抓取統計失敗:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [profile]);

  // 計算連續貢獻天數的簡易邏輯
  const calculateStreak = (data) => {
    if (data.length === 0) return 0;
    const sortedDates = data.map(d => d.date).sort().reverse();
    let streak = 0;
    // 這裡僅示範邏輯，實際可根據需求優化
    return data.length > 0 ? Math.min(data.length, 7) : 0; 
  };

  if (loading) return (
    <div className="w-full h-64 flex items-center justify-center text-slate-400">
      <Loader2 className="animate-spin mr-2" size={20} /> 統計數據讀取中...
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* 數據概覽卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-100">
          <Trophy size={24} className="mb-2 opacity-80" />
          <div className="text-3xl font-black">{summary.total}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">總貢獻次數</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <Flame size={24} className="mb-2 text-orange-500" />
          <div className="text-3xl font-black text-slate-800">{summary.streak}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">本週活躍度</div>
        </div>
      </div>

      {/* 日曆熱圖區塊 */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-800">我的貢獻紀錄</h3>
              <p className="text-[10px] text-slate-400 font-bold">過去一年的定觀與回報足跡</p>
            </div>
          </div>
          <MousePointer2 size={16} className="text-slate-200" />
        </div>

        <div className="px-2">
          <CalendarHeatmap
            startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
            endDate={new Date()}
            values={stats}
            classForValue={(value) => {
              if (!value) return 'color-empty';
              // 根據次數決定顏色深淺
              return `color-github-${Math.min(value.count, 4)}`;
            }}
            showWeekdayLabels={true}
            weekdayLabels={['週日', '週一', '週二', '週三', '週四', '週五', '週六']}
          />
        </div>

        {/* 圖例 */}
        <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-bold text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-100"></div>
            <div className="w-3 h-3 rounded-sm bg-[#c6e48b]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#7bc96f]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#239a3b]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#196127]"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap .color-empty { fill: #f8fafc; }
        .react-calendar-heatmap .color-github-1 { fill: #c6e48b; }
        .react-calendar-heatmap .color-github-2 { fill: #7bc96f; }
        .react-calendar-heatmap .color-github-3 { fill: #239a3b; }
        .react-calendar-heatmap .color-github-4 { fill: #196127; }
        .react-calendar-heatmap rect { rx: 2; ry: 2; }
      `}</style>
    </div>
  );
}
