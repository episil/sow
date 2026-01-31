'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, RefreshCw, Send, Loader2, Sparkles, Heart, Users, MapPin } from 'lucide-react';
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

  const shuffleQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FEEDBACK_QUESTIONS.length);
    setQuestion(FEEDBACK_QUESTIONS[randomIndex]);
  }, []);

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
      console.error('抓取失敗:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    shuffleQuestion();
    fetchFeedbacks();

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
              if (current.find(f => f.id === payload.new.id)) return current;
              const newItem = { ...payload.new, likes_count: payload.new.likes_count ?? 0 };
              return [newItem, ...current].slice(0, 20);
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shuffleQuestion, fetchFeedbacks]);

  const handleLikeInList = async (id, index) => {
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
      fetchFeedbacks();
    }
  };

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
      <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
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
                  <p className="text-slate-400 text-[10px] mt-1.5 font-bold uppercase tracking-widest">Feedback</p>
                </div>
              </div>
              <button onClick={shuffleQuestion} className="p-2 text-slate-300 hover:text-blue-500 rounded-xl transition-all">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 mb-6">
              <h3 className="text-slate-700 font-black text-lg leading-relaxed">{question}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="在此輸入您的心得..."
                className="w-full p-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold text-slate-600 h-32 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                required
              />
              <button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  feedback.trim() && !isSubmitting ? 'bg-orange-500 text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-300'
                }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} />提交回饋</>}
              </button>
            </form>
          </>
        )}
      </div>

      {/* 回饋清單 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Users className="text-slate-400" size={16} />
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">大家的心得分享</h3>
        </div>

        {isLoadingList ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid gap-4">
            {feedbacks.map((item, index) => (
              <div key={item.id} className="bg-white border border-slate-50 rounded-[2rem] p-6 shadow-sm relative animate-in slide-in-from-bottom-4">
                {/* 志工資訊區：分會與組別 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">
                    <MapPin size={10} />
                    <span className="text-[10px] font-black">{item.branch || '總會'}</span>
                  </div>
                  <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                    {item.volunteer_group || '夥伴'}
                  </span>
                  <span className="text-[9px] text-slate-300 font-bold ml-auto">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-400 text-[10px] font-bold mb-2">問：{item.question}</p>
                <p className="text-slate-700 font-bold text-sm leading-relaxed mb-8 whitespace-pre-wrap">{item.content}</p>
                
                <button 
                  onClick={() => handleLikeInList(item.id, index)}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-2xl transition-all group active:scale-90"
                >
                  <Heart 
                    size={16} 
                    className={`transition-colors ${item.likes_count > 0 ? 'fill-red-500 text-red-500' : 'text-slate-300 group-hover:text-red-400'}`} 
                  />
                  <span className={`text-xs font-black ${item.likes_count > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                    {item.likes_count}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
