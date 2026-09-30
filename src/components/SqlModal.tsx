'use client';

import React, { useState } from 'react';
import { Copy, Check, Database, X, Code2 } from 'lucide-react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlCode: string;
}

export default function SqlModal({ isOpen, onClose, sqlCode }: SqlModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Lệnh SQL Khởi Tạo Supabase (VTREPORT_)</h3>
              <p className="text-xs text-slate-500">Copy và dán vào Supabase SQL Editor để tạo bảng dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-800 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-blue-600" />
            Đã tự động thêm tiền tố <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-bold">VTREPORT_</code> tránh trùng dự án cũ
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-blue-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Đã Copy SQL!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Lệnh SQL
              </>
            )}
          </button>
        </div>

        {/* SQL Code content */}
        <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-100 flex-1 leading-relaxed">
          <pre>{sqlCode}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Tệp SQL lưu trữ tại: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">supabase/schema.sql</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
