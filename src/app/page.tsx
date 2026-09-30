'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ShipperCbmTable, { ShipmentDetail } from '@/components/ShipperCbmTable';
import ExcelUploadModal from '@/components/ExcelUploadModal';
import MergeShipperModal from '@/components/MergeShipperModal';
import { supabase } from '@/lib/supabase';
import { DuplicateGroup } from '@/lib/fuzzyMatch';
import { Package, Truck, FileSpreadsheet, Upload, Trash2, Layers, PlusCircle, Calendar, LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'cbm_report' | 'all_shipments' | 'future_tab'>('cbm_report');

  const [filterMode, setFilterMode] = useState<'all' | 'by_date' | 'by_month' | 'custom'>('all');
  
  // Filter states
  const [selectedSingleDate, setSelectedSingleDate] = useState('');
  const [selectedMonthNum, setSelectedMonthNum] = useState('09');
  const [selectedYearNum, setSelectedYearNum] = useState(String(new Date().getFullYear()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);

  // SHIPMENTS DATA STATE
  const [shipments, setShipments] = useState<ShipmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch from Supabase
  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('VTREPORT_shipment_details').select('*');
      if (data && data.length > 0) {
        const mapped: ShipmentDetail[] = data.map((row) => ({
          id: row.id,
          shipmentDate: row.shipment_date,
          contNo: row.cont_no || '',
          bookingNo: row.booking_no || '',
          shipperName: row.shipper_name,
          cbm: Number(row.cbm) || 0,
          quantity: Number(row.quantity) || 0,
          destination: row.destination || '',
          note: row.note || '',
        }));
        setShipments(mapped);
      } else {
        setShipments([]);
      }
    } catch (err) {
      console.log('No database data fetched');
      setShipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // Handle Clear All Data
  const handleClearAllData = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sạch dữ liệu để nạp lại file mới?')) return;
    setShipments([]);
    try {
      await supabase.from('VTREPORT_shipment_details').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      // Ignore
    }
  };

  // Handle Import from Excel file
  const handleImportExcel = async (
    rows: Array<{
      shipmentDate: string;
      contNo: string;
      bookingNo: string;
      shipperName: string;
      cbm: number;
      quantity: number;
      destination: string;
      note: string;
    }>,
    clearExisting: boolean
  ) => {
    const newItems: ShipmentDetail[] = rows.map((r, i) => ({
      id: `${Date.now()}-${i}`,
      shipmentDate: r.shipmentDate,
      contNo: r.contNo,
      bookingNo: r.bookingNo,
      shipperName: r.shipperName,
      cbm: r.cbm,
      quantity: r.quantity,
      destination: r.destination,
      note: r.note,
    }));

    if (rows.length > 0 && rows[0].shipmentDate) {
      setSelectedSingleDate(rows[0].shipmentDate);
      const parts = rows[0].shipmentDate.split('-');
      if (parts.length >= 2) {
        setSelectedYearNum(parts[0]);
        setSelectedMonthNum(parts[1]);
      }
    }

    if (clearExisting) {
      setShipments(newItems);
      try {
        await supabase.from('VTREPORT_shipment_details').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {}
    } else {
      setShipments((prev) => [...newItems, ...prev]);
    }

    try {
      await supabase.from('VTREPORT_shipment_details').insert(
        rows.map((r) => ({
          shipment_date: r.shipmentDate,
          cont_no: r.contNo,
          booking_no: r.bookingNo,
          shipper_name: r.shipperName,
          cbm: r.cbm,
          quantity: r.quantity,
          destination: r.destination,
          note: r.note,
        }))
      );
    } catch (err) {
      // Ignore
    }
  };

  // Handle Renaming / Merging Shipper Name
  const handleRenameShipper = async (oldName: string, newName: string) => {
    setShipments((prev) =>
      prev.map((item) =>
        item.shipperName.trim().toUpperCase() === oldName.trim().toUpperCase()
          ? { ...item, shipperName: newName }
          : item
      )
    );

    try {
      await supabase
        .from('VTREPORT_shipment_details')
        .update({ shipper_name: newName })
        .ilike('shipper_name', oldName.trim());
    } catch (err) {
      // Ignore
    }
  };

  const handleMergeShipper = async (targetName: string, sourceName: string) => {
    await handleRenameShipper(sourceName, targetName);
  };

  const handleOpenMergeModal = (duplicates: DuplicateGroup[]) => {
    setDuplicateGroups(duplicates);
    setIsMergeModalOpen(true);
  };

  // Extract unique available dates & months present in dataset
  const availableDates = Array.from(new Set(shipments.map((s) => s.shipmentDate).filter(Boolean))).sort().reverse();
  const availableMonths = Array.from(new Set(shipments.map((s) => s.shipmentDate.slice(0, 7)).filter(Boolean))).sort().reverse();

  useEffect(() => {
    if (!selectedSingleDate && availableDates.length > 0) {
      setSelectedSingleDate(availableDates[0]);
    }
  }, [availableDates, selectedSingleDate]);

  // Filter Shipments based on 4 filter modes
  const filteredShipments = shipments.filter((item) => {
    if (filterMode === 'by_date') {
      return item.shipmentDate === selectedSingleDate;
    }
    if (filterMode === 'by_month') {
      const yearMonth = `${selectedYearNum}-${selectedMonthNum}`;
      return item.shipmentDate.startsWith(yearMonth);
    }
    if (filterMode === 'custom') {
      if (startDate && item.shipmentDate < startDate) return false;
      if (endDate && item.shipmentDate > endDate) return false;
      return true;
    }
    return true; // 'all'
  });

  const totalCbm = filteredShipments.reduce((sum, s) => sum + s.cbm, 0);
  const totalShippers = new Set(filteredShipments.map((s) => s.shipperName.trim().toUpperCase())).size;
  const totalPkgs = filteredShipments.reduce((sum, s) => sum + s.quantity, 0);

  const monthsList = [
    { value: '01', label: 'Tháng 1' },
    { value: '02', label: 'Tháng 2' },
    { value: '03', label: 'Tháng 3' },
    { value: '04', label: 'Tháng 4' },
    { value: '05', label: 'Tháng 5' },
    { value: '06', label: 'Tháng 6' },
    { value: '07', label: 'Tháng 7' },
    { value: '08', label: 'Tháng 8' },
    { value: '09', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onClearAllData={handleClearAllData}
        hasData={shipments.length > 0}
      />

      {/* TAB NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('cbm_report')}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-extrabold transition-all ${
                activeTab === 'cbm_report'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Sản Lượng CBM</span>
            </button>

            <button
              onClick={() => setActiveTab('future_tab')}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-extrabold transition-all ${
                activeTab === 'future_tab'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <span>+ Thêm Tab Báo Cáo Mới (Tương lai)</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* TAB 1: CBM REPORT CONTENT */}
        {activeTab === 'cbm_report' && (
          <div className="space-y-8">
            {/* TIME FILTER TOOLBAR INSIDE THE CBM TAB */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Lọc Thời Gian Báo Cáo:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Tất cả */}
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filterMode === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({shipments.length} lô)
                </button>

                {/* Chọn Ngày */}
                <button
                  onClick={() => setFilterMode('by_date')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filterMode === 'by_date'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chọn Ngày
                </button>

                {/* Chọn Tháng */}
                <button
                  onClick={() => setFilterMode('by_month')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filterMode === 'by_month'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chọn Tháng
                </button>

                {/* Tùy chỉnh */}
                <button
                  onClick={() => setFilterMode('custom')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    filterMode === 'custom'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tùy chỉnh khoảng ngày
                </button>
              </div>
            </div>

            {/* SUB-CONTROLS FOR SELECTED FILTER MODE */}
            {filterMode === 'by_date' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-emerald-950">Chọn Ngày Đóng Cont Cụ Thể:</span>
                <div className="flex items-center gap-2">
                  {availableDates.length > 0 && (
                    <select
                      value={selectedSingleDate}
                      onChange={(e) => setSelectedSingleDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                    >
                      {availableDates.map((d) => (
                        <option key={d} value={d}>
                          Ngày {d}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="date"
                    value={selectedSingleDate}
                    onChange={(e) => setSelectedSingleDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {filterMode === 'by_month' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-emerald-950">Chọn Tháng Báo Cáo:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonthNum}
                    onChange={(e) => setSelectedMonthNum(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {monthsList.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYearNum}
                    onChange={(e) => setSelectedYearNum(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {['2025', '2026', '2027', '2028'].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {filterMode === 'custom' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-emerald-950">Khoảng Ngày Tùy Chỉnh:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Từ ngày:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  />
                  <span className="text-slate-600 font-medium">Đến ngày:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* 3 Overview Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {filterMode === 'by_month'
                      ? `TỔNG CBM THÁNG ${selectedMonthNum}/${selectedYearNum}`
                      : filterMode === 'by_date'
                      ? `TỔNG CBM NGÀY ${selectedSingleDate}`
                      : 'TỔNG SỐ CBM HÀNG ĐÃ ĐÓNG'}
                  </p>
                  <h3 className="text-3xl font-black text-blue-700 mt-1">{totalCbm.toFixed(2)} m³</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Sản lượng mét khối của khoảng lọc</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Package className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TỔNG SỐ SHIPPER (CHỦ HÀNG)</p>
                  <h3 className="text-3xl font-black text-emerald-700 mt-1">{totalShippers} Chủ Hàng</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Trong khoảng thời gian đang lọc</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Truck className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TỔNG SỐ KIỆN / THÙNG (SL)</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">{totalPkgs} Kiện</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Tổng cộng {filteredShipments.length} đợt đóng hàng</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Main Shipper Summary Table */}
            <section>
              {shipments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Chưa có dữ liệu đóng hàng</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Bấm nút <strong className="text-emerald-700">"Tải File Excel"</strong> ở góc trên thanh công cụ để nạp file Biên Bản Đóng Hàng của bạn.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExcelModalOpen(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Tải File Excel Ngay</span>
                  </button>
                </div>
              ) : (
                <ShipperCbmTable
                  shipments={filteredShipments}
                  onRenameShipper={handleRenameShipper}
                  onOpenMergeModal={handleOpenMergeModal}
                  onOpenExcelModal={() => setIsExcelModalOpen(true)}
                />
              )}
            </section>
          </div>
        )}

        {/* TAB 2: FUTURE EXTENSION TAB PLACEHOLDER */}
        {activeTab === 'future_tab' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Khu Vực Dành Cho Báo Cáo Tương Lai</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sau này khi bạn cần thêm các tab chức năng khác, chúng ta sẽ mở rộng ở đây.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 VT REPORT - Báo Cáo Doanh Nghiệp & CBM Logistics.</p>
      </footer>

      {/* Modals */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleImportExcel}
      />

      <MergeShipperModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        duplicates={duplicateGroups}
        onMerge={handleMergeShipper}
      />
    </div>
  );
}
