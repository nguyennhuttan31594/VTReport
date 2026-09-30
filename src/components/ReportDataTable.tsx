'use client';

import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, Clock, FileText, ArrowUpDown, ChevronRight, AlertCircle, Database } from 'lucide-react';

export interface ReportItem {
  id: string;
  period: string;
  department: string;
  category: string;
  metricName: string;
  unit: string;
  targetValue: number;
  actualValue: number;
  note: string;
  status: 'approved' | 'submitted' | 'draft';
  createdBy: string;
}

interface ReportDataTableProps {
  reports: ReportItem[];
  isUsingFallbackData: boolean;
  onRefresh: () => void;
}

export default function ReportDataTable({ reports, isUsingFallbackData, onRefresh }: ReportDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const formatValue = (val: number, unit: string) => {
    if (unit === 'VNĐ') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    }
    return `${val.toLocaleString()} ${unit}`;
  };

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.note.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment === 'all' || item.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: ReportItem['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã duyệt
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ duyệt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Dự thảo
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Bảng Chi Tiết Số Liệu Báo Cáo Tổng Hợp</h3>
              {isUsingFallbackData ? (
                <span
                  title="Đang hiển thị số liệu mẫu. Hãy dán câu lệnh SQL vào Supabase để đồng bộ dữ liệu thật."
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Chế độ Demo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Database className="w-3 h-3 text-emerald-600" /> Supabase Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách các chỉ tiêu báo cáo được ghi nhận theo kỳ</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm chỉ tiêu, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Lọc theo:
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả Khối / Phòng ban</option>
            <option value="Khối Kinh Doanh & Dịch Vụ">Khối Kinh Doanh & Dịch Vụ</option>
            <option value="Khối Công Nghệ & Kỹ Thuật">Khối Công Nghệ & Kỹ Thuật</option>
            <option value="Khối Tài Chính Kế Toán">Khối Tài Chính Kế Toán</option>
            <option value="Khối Hành Chính Nhân Sự">Khối Hành Chính Nhân Sự</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="submitted">Chờ duyệt</option>
            <option value="draft">Dự thảo</option>
          </select>

          <span className="ml-auto text-xs text-slate-500 font-medium">
            Hiển thị <span className="font-bold text-slate-800">{filteredReports.length}</span> chỉ tiêu
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">Phòng ban</th>
              <th className="px-5 py-3.5">Tên chỉ tiêu báo cáo</th>
              <th className="px-5 py-3.5 text-right">Kế hoạch</th>
              <th className="px-5 py-3.5 text-right">Thực hiện</th>
              <th className="px-5 py-3.5">Tiến độ KPI</th>
              <th className="px-5 py-3.5">Ghi chú</th>
              <th className="px-5 py-3.5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  Không tìm thấy số liệu báo cáo phù hợp
                </td>
              </tr>
            ) : (
              filteredReports.map((item) => {
                const completionRate = item.targetValue > 0 ? Math.round((item.actualValue / item.targetValue) * 100) : 100;
                const isExceeded = completionRate >= 100;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800">{item.department}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div>{item.metricName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.category}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-600">
                      {formatValue(item.targetValue, item.unit)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {formatValue(item.actualValue, item.unit)}
                    </td>
                    <td className="px-5 py-4 min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className={isExceeded ? 'text-emerald-600' : 'text-blue-600'}>{completionRate}%</span>
                        <span className="text-slate-400 font-normal">{isExceeded ? 'Vượt chỉ tiêu' : 'Đang thực hiện'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isExceeded ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(completionRate, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate" title={item.note}>
                      {item.note || '-'}
                    </td>
                    <td className="px-5 py-4 text-center">{getStatusBadge(item.status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
