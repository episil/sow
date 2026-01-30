'use client';

import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import ExifReader from 'exifreader'; // 引入 EXIF 解析套件
import { X, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

export default function PhotoUpload({ onImageProcessed, onLocationExtracted, clearTrigger }) {
  const [preview, setPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (clearTrigger) {
      handleClear();
    }
  }, [clearTrigger]);

  const compressionOptions = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.7
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setIsCompressing(true);

    try {
      // 1. 先解析 GPS 資訊 (必須使用原始檔案 file)
      try {
        const tags = await ExifReader.load(file);
        if (tags.GPSLatitude && tags.GPSLongitude) {
          const lat = tags.GPSLatitude.description;
          const lng = tags.GPSLongitude.description;
          
          // 如果有抓到座標，回傳給父組件
          if (onLocationExtracted) {
            onLocationExtracted({ lat, lng });
          }
        }
      } catch (exifErr) {
        console.log("照片不含 GPS 數據或解析失敗");
      }

      // 2. 產生預覽圖
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // 3. 執行壓縮
      const compressedFile = await imageCompression(file, compressionOptions);
      
      // 4. 回傳壓縮後的檔案
      onImageProcessed(compressedFile);
    } catch (err) {
      console.error('處理失敗:', err);
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
    <div className="w-full text-left">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="w-full h-48 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center gap-3 group hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
            <Upload size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-500">上傳照片</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">Select from photo library</p>
          </div>
        </button>
      ) : (
        <div className="relative w-full h-64 rounded-[2.5rem] overflow-hidden shadow-lg border border-white">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          
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

          <button
            type="button"
            onClick={handleClear}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
