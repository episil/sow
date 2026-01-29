'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, X, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PhotoUpload({ onImageProcessed, clearTrigger }) {
  const [preview, setPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // 壓縮設定
  const compressionOptions = {
    maxSizeMB: 1,          // 壓縮至 1MB 以下
    maxWidthOrHeight: 1200, // 最大尺寸 1200px
    useWebWorker: true
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 重置狀態
    setError(null);
    setIsCompressing(true);

    try {
      // 1. 產生本地預覽圖
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // 2. 執行壓縮
      const compressedFile = await imageCompression(file, compressionOptions);
      
      // 3. 回傳壓縮後的檔案給父組件
      onImageProcessed(compressedFile);
    } catch (err) {
      console.error('壓縮失敗:', err);
      setError('照片處理失敗，請再試一次');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageProcessed(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* 隱藏的 Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment" // 提示手機直接開啟相機
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {!preview ? (
        /* 未上傳狀態：大面積點擊區 */
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="w-full h-48 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center gap-3 group hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
            <Camera size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-500">拍下今天的發現</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Capture Species</p>
          </div>
        </button>
      ) : (
        /* 已上傳狀態：預覽圖與處理狀態 */
        <div className="relative w-full h-64 rounded-[2.5rem] overflow-hidden shadow-lg border border-white">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          
          {/* 覆蓋層：壓縮中或完成 */}
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
            {isCompressing ? (
              <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <span className="text-xs font-black text-slate-800">影像優化中...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/90 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-3 text-white shadow-xl">
                <AlertCircle size={20} />
                <span className="text-xs font-black">{error}</span>
              </div>
            ) : (
              <div className="bg-emerald-500/90 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-2 text-white shadow-xl">
                <CheckCircle2 size={18} />
                <span className="text-xs font-black">影像已就緒</span>
              </div>
            )}
          </div>

          {/* 移除按鈕 */}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* 提示文案 */}
      {!preview && (
        <div className="mt-4 flex items-center justify-center gap-4 text-slate-300">
          <div className="flex items-center gap-1">
            <ImageIcon size={12} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Auto Resize</span>
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span className="text-[9px] font-bold uppercase tracking-tight">HD Quality</span>
          </div>
        </div>
      )}
    </div>
  );
}
