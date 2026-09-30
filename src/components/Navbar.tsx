'use client';

import React from 'react';
import { Package, Trash2 } from 'lucide-react';

interface NavbarProps {
  onClearAllData?: () => void;
  hasData?: boolean;
}

export default function Navbar({
  onClearAllData,
  hasData,
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">VT REPORT</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Logistics
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Báo cáo nhanh</p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Clear Data Button (If has data) */}
            {hasData && onClearAllData && (
              <button
                onClick={onClearAllData}
                title="Xóa toàn bộ dữ liệu hiện tại"
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa Dữ Liệu</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
