'use client';

import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle2 } from 'lucide-react';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: {
    period: string;
    department: string;
    metricName: string;
    unit: string;
    targetValue: number;
    actualValue: number;
    note: string;
  }) => Promise<void>;
}

export default function NewReportModal({ isOpen, onClose, onSubmit }: NewReportModalProps) {
  const [period, setPeriod] = useState('Tháng 09/2026');
  const [department, setDepartment] = useState('Khối Kinh Doanh & Dịch Vụ');
  const [metricName, setMetricName] = useState('');
  const [unit, setUnit] = useState('VNĐ');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [actualValue, setActualValue] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        period,
        department,
        metricName,
        unit,
        targetValue: Number(targetValue) || 0,
        actualValue: Number(actualValue) || 0,
        note,
      });
      // Reset form
      setMetricName('');
      setTargetValue('');
      setActualValue('');
      setNote('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Thêm Bản Ghi Báo Cáo Mới</h3>
              <p className="text-xs text-slate-500">Nhập số liệu thực hiện chỉ tiêu báo cáo tổng hợp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kỳ báo cáo</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Tháng 09/2026">Tháng 09/2026</option>
                <option value="Quý 3/2026">Quý 3/2026</option>
                <option value="Năm 2026">Năm 2026</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khối / Phòng ban</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Khối Kinh Doanh & Dịch Vụ">Khối Kinh Doanh & Dịch Vụ</option>
                <option value="Khối Công Nghệ & Kỹ Thuật">Khối Công Nghệ & Kỹ Thuật</option>
                <option value="Khối Tài Chính Kế Toán">Khối Tài Chính Kế Toán</option>
                <option value="Khối Hành Chính Nhân Sự">Khối Hành Chính Nhân Sự</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên chỉ tiêu báo cáo *</label>
            <input
              type="text"
              required
              placeholder="VD: Doanh thu phần mềm SaaS, Số lượng khách mới..."
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kế hoạch</label>
              <input
                type="number"
                placeholder="0"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thực hiện</label>
              <input
                type="number"
                placeholder="0"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú / Giải trình</label>
            <textarea
              rows={2}
              placeholder="Nhập ghi chú thêm về số liệu báo cáo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              {submitting ? 'Đang lưu...' : 'Lưu Báo Cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
