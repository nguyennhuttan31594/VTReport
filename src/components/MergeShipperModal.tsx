'use client';

import React, { useState } from 'react';
import { X, GitMerge, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { DuplicateGroup } from '@/lib/fuzzyMatch';

interface MergeShipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateGroup[];
  onMerge: (targetName: string, sourceName: string) => Promise<void>;
}

export default function MergeShipperModal({
  isOpen,
  onClose,
  duplicates,
  onMerge,
}: MergeShipperModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || duplicates.length === 0) return null;

  const currentPair = duplicates[currentIndex];

  const handleChoose = async (chosenName: string, sourceName: string) => {
    setIsProcessing(true);
    await onMerge(chosenName, sourceName);
    setIsProcessing(false);

    if (currentIndex + 1 < duplicates.length) {
      setCurrentIndex(currentIndex + 1);
      setCustomName('');
    } else {
      onClose();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    // Merge both to customName
    handleChoose(customName.trim(), currentPair.originalName1);
    handleChoose(customName.trim(), currentPair.originalName2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cảnh Báo Trùng Tên Shipper</h3>
              <p className="text-xs text-slate-500">
                Phát hiện {duplicates.length} cặp tên gần giống nhau ({currentIndex + 1}/{duplicates.length})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <p className="font-bold text-slate-700 text-xs">
              Hệ thống phát hiện 2 tên sau có thể là 1 đơn vị:
            </p>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white border border-blue-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">TÊN 1</span>
                <span className="font-extrabold text-blue-700 text-sm">{currentPair.originalName1}</span>
              </div>
              <div className="p-3 bg-white border border-indigo-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">TÊN 2</span>
                <span className="font-extrabold text-indigo-700 text-sm">{currentPair.originalName2}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Bạn muốn gộp 2 tên này thành tên nào?
            </label>

            <div className="space-y-2">
              <button
                disabled={isProcessing}
                onClick={() => handleChoose(currentPair.originalName1, currentPair.originalName2)}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left flex items-center justify-between font-bold text-blue-900 transition-all"
              >
                <span>Gộp tất cả thành: "{currentPair.originalName1}"</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>

              <button
                disabled={isProcessing}
                onClick={() => handleChoose(currentPair.originalName2, currentPair.originalName1)}
                className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-left flex items-center justify-between font-bold text-indigo-900 transition-all"
              >
                <span>Gộp tất cả thành: "{currentPair.originalName2}"</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Custom Rename Form */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block font-semibold text-slate-700">Hoặc đặt tên chuẩn tùy chỉnh khác:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập tên chuẩn muốn đổi..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!customName.trim() || isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Đổi Tên
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            onClick={() => {
              if (currentIndex + 1 < duplicates.length) {
                setCurrentIndex(currentIndex + 1);
              } else {
                onClose();
              }
            }}
            className="text-slate-500 hover:text-slate-700 font-medium"
          >
            Bỏ qua cặp này
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
