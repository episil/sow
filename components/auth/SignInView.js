'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LogIn, User, MapPin, Users, Hash, Phone, Leaf, CheckCircle } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const BRANCHES = ["台北分會", "桃園分會", "新竹分會", "台中分會", "雲林分會", "嘉義分會", "台南分會", "高雄分會", "台東分會", "花蓮分會", "宜蘭分會"];
const GROUPS = ["解說教育組", "推廣講師組", "親子教育組", "兒童教育組", "棲地工作組", "研究發展組", "國際事務組", "鄉土關懷組", "氣候變遷教育組", "綠活圖發展組", "特殊教育組", "自然中心發展組", "悅讀荒野工作組"];

export default function SignInView({ onLoginSuccess }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 註冊表單狀態
  const [formData, setFormData] = useState({
    full_name: '',
    nature_name: '',
    branch: '',
    volunteer_group: '',
    training_period: '',
    phone: ''
  });

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const currentUser = session?.user;
        setUser(currentUser);
        await checkProfile(currentUser);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await checkProfile(user);
    }
    setLoading(false);
  };

  const checkProfile = async (currentUser) => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error || !data) {
      setShowRegisterForm(true);
    } else {
      onLoginSuccess(data);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('profiles').insert([
      {
        id: user.id,
        email: user.email,
        ...formData
      }
    ]);

    if (error) {
      alert('註冊失敗：' + error.message);
      setIsSubmitting(false);
    } else {
      checkProfile(user);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">系統初始化中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-slate-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
            <Leaf className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">解說員的荒野生活</h1>
          <p className="text-slate-400 text-sm mt-1">志工專屬數位夥伴</p>
        </div>

        {!user ? (
          /* Step 1: Login Button */
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
            <span className="font-black text-slate-700">使用 Google 帳號登入</span>
          </button>
        ) : showRegisterForm ? (
          /* Step 2: Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
              <CheckCircle className="text-blue-500" size={20} />
              <p className="text-xs text-blue-700 font-bold">驗證成功！請填寫志工基本資料以完成註冊。</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputItem icon={<User size={16}/>} label="真實姓名" placeholder="王小明" 
                value={formData.full_name} onChange={v => setFormData({...formData, full_name: v})} required />
              <InputItem icon={<Leaf size={16}/>} label="自然名" placeholder="小草" 
                value={formData.nature_name} onChange={v => setFormData({...formData, nature_name: v})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectItem icon={<MapPin size={16}/>} label="分會別" options={BRANCHES} 
                value={formData.branch} onChange={v => setFormData({...formData, branch: v})} required />
              <SelectItem icon={<Users size={16}/>} label="組別" options={GROUPS} 
                value={formData.volunteer_group} onChange={v => setFormData({...formData, volunteer_group: v})} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputItem icon={<Hash size={16}/>} label="期別" placeholder="解 25" 
                value={formData.training_period} onChange={v => setFormData({...formData, training_period: v})} />
              <InputItem icon={<Phone size={16}/>} label="手機" placeholder="0912..." 
                value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:bg-slate-300"
            >
              {isSubmitting ? '註冊中...' : '完成註冊，開始使用'}
            </button>
          </form>
        ) : (
          <div className="text-center py-10 text-slate-400">跳轉中...</div>
        )}

        <p className="text-center text-[10px] text-slate-300 mt-8 uppercase tracking-widest">Society of Wilderness</p>
      </div>
    </div>
  );
}

// 輔助組件：輸入框
function InputItem({ icon, label, placeholder, value, onChange, required = false }) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black text-slate-400 mb-1 ml-1 uppercase">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">{icon}</span>
        <input
          required={required}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

// 輔助組件：下拉選單
function SelectItem({ icon, label, options, value, onChange, required = false }) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black text-slate-400 mb-1 ml-1 uppercase">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">{icon}</span>
        <select
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
        >
          <option value="">請選擇</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    </div>
  );
}
