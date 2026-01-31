'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, RefreshCw, Send, Loader2, Sparkles, Heart } from 'lucide-react'; // 新增 Heart
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
  const [currentFeedbackId, setCurrentFeedbackId] = useState(null); // 用於記錄剛提交的 ID
  const [localLikes, setLocalLikes] = useState(0); // 本地顯示讚數

  useEffect(() => {
    shuffleQuestion();
  }, []);

  const shuffleQuestion = () => {
    const randomIndex = Math.floor(Math.random() * FEEDBACK_QUESTIONS.length);
    setQuestion(FEEDBACK_QUESTIONS[randomIndex]);
  };

  // 新增：處理按讚邏輯
  const handleLike = async () => {
    if (!currentFeedbackId) return;

    // UI 立即反應 (Optimistic UI)
    setLocalLikes(prev => prev + 1);

    try {
      const { error } = await supabase.rpc('increment_likes', { row_id: currentFeedbackId });
      if (error) throw error;
    } catch (err) {
      console.error('按讚失敗:', err.message);
      // 如果失敗，可以考慮把 localLikes 減回來，但為了不限次數體驗流暢，通常不強制回滾
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('daily_feedbacks')
        .insert([{
          user_id: profile.id,
          question: question,
          content: feedback,
          branch: profile.branch,
          volunteer_group: profile.volunteer_group
        }])
        .select(); // 獲取回傳的資料以取得 ID

      if (error) throw error;
      
      if (data && data[0]) {
        setCurrentFeedbackId(data[0].id);
      }
      
      setSubmitted(true);
      // 增加延遲，讓使用者有時間點讚
      setTimeout(() => {
        setSubmitted(false);
        setFeedback("");
        setCurrentFeedbackId(null);
        setLocalLikes(0);
        shuffleQuestion();
      }, 5000); // 延長至 5 秒

    } catch (err) {
      alert('回饋傳送失敗：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full bg-blue-50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
          <Sparkles className="text-white" size={32} />
        </div>
        <h3 className="text-lg font-black text-blue-800">感謝你的分享！</h3>
        <p className="text-blue-600/70 text-xs mt-2 font-bold mb-6">你的回饋是荒野前進的動力</p>
        
        {/* 按讚互動區 */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleLike}
            className="group relative flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md hover:shadow-xl active:scale-90 transition-all border-4 border-blue-100"
          >
            <Heart 
              className={`transition-colors ${localLikes > 0 ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} 
              size={32} 
            />
            {localLikes > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                +{localLikes}
              </span>
            )}
          </button>
          <p className="text-[10px] font-black text-slate-400">點擊愛心為自己打氣！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
      {/* ...其餘代碼保持不變... */}
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
          className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <MessageCircle size={80} />
        </div>
        <h3 className="text-slate-700 font-black text-lg relative z-10 leading-relaxed">
          {question}
        </h3>
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
            feedback.trim() && !isSubmitting
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 active:scale-95'
              : 'bg-slate-100 text-slate-300'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <Send size={18} />
              提交回饋
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-[10px] text-slate-300 font-bold text-center">
        您的回饋將協助我們優化未來的定觀活動
      </p>
    </div>
  );
}
