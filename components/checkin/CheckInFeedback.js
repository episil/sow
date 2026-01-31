'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, RefreshCw, Send, Loader2, Sparkles, Heart, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FEEDBACK_QUESTIONS = [
  "今日定觀印象最深刻的是？",
  "今日定觀最有趣的是？",
  "今日定觀影響你最大的是？",
  "今日定觀發現了什麼？",
  "今日定觀的感受是？",
  "今日定觀的驚喜是？",
  "今日定觀有什麼遺憾？",
  "今日定觀有何不同？",
  "你想對召集人說的是？",
  "今日定觀最有話題的是？"
];

export default function CheckInFeedback({ profile }) {
  const [question, setQuestion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // 隨機切換問題
  const shuffleQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FEEDBACK_QUESTIONS.length);
    setQuestion(FEEDBACK_QUESTIONS[randomIndex]);
  }, []);

  // 抓取最近 20 則回饋
  const fetchFeedbacks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('daily_feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const processedData = data?.map(item => ({
        ...item,
        likes_count: item.likes_count ?? 0
      }));
      setFeedbacks(processedData || []);
    } catch (err) {
      console.error('抓取清單失敗:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // 初始化與訂閱 Realtime
  useEffect(() => {
    shuffleQuestion();
    fetchFeedbacks();

    // 監聽所有變動 (INSERT 與 UPDATE)
    const channel = supabase
      .channel('daily_feedbacks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_feedbacks' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setFeedbacks(current => 
              current.map(f => 
                f.id === payload.new.id 
                  ? { ...f, ...payload.new, likes_count: payload.new.likes_count ?? f.likes_count } 
                  : f
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setFeedbacks(current => {
              // 檢查是否已存在，避免重複顯示
              if (current.find(f => f.id === payload.new.id)) return current;
              const newItem = { ...payload.new, likes_count: payload.new.likes_count ?? 0 };
              return [newItem, ...current].slice(0, 20);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shuffleQuestion, fetchFeedbacks]);

  // 處理按讚
  const handleLikeInList = async (id, index) => {
    // Optimistic UI：先更新本地狀態，讓使用者點擊後立即有反應
    setFeedbacks(current => {
      const newList = [...current];
      if (newList[index]) {
        newList[index] = { 
          ...newList[index], 
          likes_count: (newList[index].likes_count || 0) + 1 
        };
      }
      return newList;
    });

    try {
      const { error } = await supabase.rpc('increment_likes', { row_id: id });
      if (error) throw error;
    } catch (err) {
      console.error('點讚失敗:', err.message);
      // 失敗時校正數據
      fetchFeedbacks();
    }
  };

  // 提交回饋
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('daily_feedbacks')
        .insert([{
          user_id: profile.id,
          question: question,
          content: feedback,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group,
          likes_count: 0
        }]);

      if (error) throw error;
      
      setSubmitted(true);
      // 因為有 Realtime INSERT 監聽，清單會自動更新，但手動 fetch 可確保排序正確
      fetchFeedbacks();

      setTimeout(() => {
        setSubmitted(false);
        setFeedback("");
        shuffleQuestion();
      }, 3000);

    } catch (err) {
      alert('回饋傳送失敗：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* 填寫回饋卡片 */}
      <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm transition-all">
        {submitted ? (
          <div className="py-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
              <Sparkles className="text-white" size={32} />
            </div>
            <h3 className="text-lg font-black text-blue-800">感謝你的分享！</h3>
            <p className="text-blue-600/70 text-xs mt-2 font-bold">你的回饋是荒野前進的動力</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="text-orange-500" size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black text-slate-800 leading-none">填寫活動回饋</h2>
                  <p className="text-slate-400 text-[10px] mt-1.5 font-bold uppercase tracking-widest">Post-Event Feedback</p>
                </div>
              </div>
              <button 
                onClick={shuffleQuestion} 
                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:rotate-180 duration-500"
                title="換一個問題"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageCircle size={80} />
              </div>
              <h3 className="text-slate-700 font-black text-lg relative z-10 leading-relaxed">{question}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="在此輸入您的心情或觀察..."
                className="w-full p-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold text-slate-600 h-32 focus:ring-2 focus:ring-orange-100 transition-all resize-none placeholder:text-slate-300"
                required
              />
              <button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  feedback.trim() && !isSubmitting ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 active:scale-95' : 'bg-slate-100 text-slate-300'
                }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} />提交回饋</>}
              </button>
            </form>
          </>
        )}
      </div>

      {/* 近期回饋清單 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Users className="text-slate-400" size={16} />
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">大家的心得分享</h3>
        </div>

        {isLoadingList ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid gap-4">
            {feedbacks.length === 0 ? (
              <p className="text-center py-10 text-slate-300 font-bold text-sm bg-slate-50 rounded-[2rem]">尚無回饋，成為第一個分享的人吧！</p>
            ) : (
              feedbacks.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all relative group animate-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">
                      {item.volunteer_group || '荒野夥伴'}
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold mb-2">問：{item.question}</p>
                  <p className="text-slate-700 font-bold text-sm leading-relaxed mb-8 whitespace-pre-wrap">{item.content}</p>
                  
                  {/* 按讚按鈕 */}
                  <button 
                    onClick={() => handleLikeInList(item.id, index)}
                    className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-2xl transition-all group/like active:scale-90"
                  >
                    <Heart 
                      size={16} 
                      className={`transition-colors ${item.likes_count > 0 ? 'fill-red-500 text-red-500' : 'text-slate-300 group-hover/like:text-red-400'}`} 
                    />
                    <span className={`text-xs font-black ${item.likes_count > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                      {item.likes_count}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-300 font-bold text-center">
        您的回饋將協助我們優化未來的定觀活動
      </p>
    </div>
  );
}
