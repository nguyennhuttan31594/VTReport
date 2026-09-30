'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiData {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  kpiCompletion: number;
}

interface KpiSummaryCardProps {
  data: KpiData;
}

export default function KpiSummaryCard({ data }: KpiSummaryCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const cards = [
    {
      title: 'Tổng Doanh Thu Hợp Đồng',
      value: formatCurrency(data.totalRevenue),
      target: 'Kế hoạch: ' + formatCurrency(2300000000),
      trend: '+12.4% so với kỳ trước',
      isPositive: true,
      icon: DollarSign,
      gradient: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-blue-50/70 border-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Tổng Chi Phí Vận Hành',
      value: formatCurrency(data.totalExpense),
      target: 'Kế hoạch: ' + formatCurrency(800000000),
      trend: '-5.2% tối ưu chi phí',
      isPositive: true, // Reduced costs is positive
      icon: PieChart,
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50/70 border-amber-100',
      textColor: 'text-amber-600',
    },
    {
      title: 'Lợi Nhuận Gộp Tổng Hợp',
      value: formatCurrency(data.netProfit),
      target: 'Tỷ suất lợi nhuận: 70.6%',
      trend: '+18.1% tăng trưởng',
      isPositive: true,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50/70 border-emerald-100',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Tỷ Lệ Hoàn Thành Chỉ Tiêu (KPI)',
      value: `${data.kpiCompletion}%`,
      target: 'Mục tiêu: ≥ 100%',
      trend: 'Đạt cấp Xuất Sắc',
      isPositive: data.kpiCompletion >= 100,
      icon: Target,
      gradient: 'from-violet-500 to-purple-600',
      lightBg: 'bg-violet-50/70 border-violet-100',
      textColor: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group"
          >
            {/* Top decorative gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{card.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${card.lightBg} border ${card.textColor}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{card.target}</span>
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  card.isPositive ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full'
                }`}
              >
                {card.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
