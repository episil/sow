'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Filter, Globe, MapPin, Users, Loader2, Crown } from 'lucide-react';

const BRANCHES = ["台北分會", "桃園分會", "新竹分會", "台中分會", "雲林分會", "嘉義分會", "台南分會", "高雄分會", "台東分會", "花蓮分會", "宜蘭分會"];
const GROUPS = ["解說教育組", "推廣講師組", "親子教育組", "兒童教育組", "棲地工作組", "研究發展組", "國際事務組", "鄉土關懷組", "氣候變遷教育組", "綠活圖發展組", "特殊教育組", "自然中心發展組", "悅讀荒野工作組"];

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, branch, group
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [filterType, filterValue]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 構建查詢：從 daily_contributions 視圖聚合資料，並關聯 profiles 取得自然名
      let query = supabase
        .from('profiles')
        .select(`
          nature_name,
          full_name,
          branch,
          volunteer_group,
          checkin_count: checkin_records(count),
          report_count: species_reports(count)
        `);

      if (filterType === 'branch' && filterValue) {
        query = query.eq('branch', filterValue);
      } else if (filterType === 'group' && filterValue) {
        query = query.eq('volunteer_group', filterValue);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // 計算總得分並排序
      const sortedData = profiles
        .map(p => ({
          name: p.nature_name || p.full_name,
          branch: p.branch,
          group: p.volunteer_group,
          total: (p.checkin_count[0]?.count || 0) + (p.report_count[0]?.count || 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // 只取前 10 名

      setData(sortedData);
    } catch (err) {
      console.error('排行抓取失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#0d1117] rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 text-slate-200">
      
      {/* Header & Filter UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Trophy className="text-yellow-500" /> 解鎖秘密行程
          </h2>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">荒野志工榮譽榜</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton active={filterType === 'all'} onClick={() => { setFilterType('all'); setFilterValue(''); }}>
            <Globe size={14} /> 全台
          </FilterButton>
          
          <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-slate-800">
            <select 
              className="bg-transparent text-xs font-bold px-2 outline-none border-none text-slate-400"
              value={filterType === 'branch' ? filterValue : ''}
              onChange={(e) => { setFilterType('branch'); setFilterValue(e.target.value); }}
            >
              <option value="">選擇分會</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-slate-800">
            <select 
              className="bg-transparent text-xs font-bold px-2 outline-none border-none text-slate-400"
              value={filterType === 'group' ? filterValue : ''}
              onChange={(e) => { setFilterType('group'); setFilterValue(e.target.value); }}
            >
              <option value="">選擇組別</option>
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-600" /></div>
        ) : data.length > 0 ? (
          data.map((user, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20' : 'bg-[#161b22] border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <RankBadge index={index} />
                <div>
                  <div className="font-black text-white flex items-center gap-2">
                    {user.name}
                    {index === 0 && <Crown size={14} className="text-yellow-500" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {user.branch} · {user.group}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-[#39d353]">{user.total}</div>
                <div className="text-[9px] text-slate-600 font-bold uppercase">Contributions</div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-slate-600 font-bold">目前暫無數據</div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-600 font-medium">秘密行程解鎖門檻：累積滿 100 貢獻度</p>
      </div>
    </div>
  );
}

// 輔助組件：篩選按鈕
function FilterButton({ children, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all border ${
        active ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-[#161b22] text-slate-400 border-slate-800 hover:border-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

// 輔助組件：排名圖章
function RankBadge({ index }) {
  if (index === 0) return <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-900/20"><Medal size={16} className="text-yellow-900" /></div>;
  if (index === 1) return <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center"><Medal size={16} className="text-slate-600" /></div>;
  if (index === 2) return <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center"><Medal size={16} className="text-orange-900" /></div>;
  return <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-700">{index + 1}</div>;
}
