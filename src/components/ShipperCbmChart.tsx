'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ShipperCbmChartProps {
  shipments: Array<{
    shipperName: string;
    cbm: number;
  }>;
}

export default function ShipperCbmChart({ shipments }: ShipperCbmChartProps) {
  // Aggregate total CBM per shipper
  const map: { [name: string]: number } = {};
  shipments.forEach((item) => {
    const name = item.shipperName.trim();
    map[name] = (map[name] || 0) + item.cbm;
  });

  const chartData = Object.keys(map)
    .map((name) => ({
      name,
      cbm: parseFloat(map[name].toFixed(2)),
    }))
    .sort((a, b) => b.cbm - a.cbm);

  const colors = ['#2563eb', '#3b82f6', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700">
          <p className="font-bold text-slate-200 mb-1">{label}</p>
          <p className="text-emerald-400 font-extrabold text-sm">
            {payload[0].value.toFixed(2)} CBM (m³)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Biểu Đồ So Sánh Sản Lượng CBM Theo Shipper</h4>
            <p className="text-xs text-slate-500">Trực quan hóa lượng mét khối (m³) của từng nhà chủ hàng</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit=" m³"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cbm" name="Tổng CBM" radius={[8, 8, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
