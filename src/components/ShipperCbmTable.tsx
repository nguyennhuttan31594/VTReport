import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Trophy, Edit3, GitMerge, AlertTriangle, Download, FileSpreadsheet, Layers, ListFilter, Upload } from 'lucide-react';
import { findDuplicateShipperNames, DuplicateGroup } from '@/lib/fuzzyMatch';
import * as XLSX from 'xlsx';

export interface ShipmentDetail {
  id: string;
  shipmentDate: string;
  contNo: string;
  bookingNo: string;
  shipperName: string;
  cbm: number;
  quantity: number;
  destination: string;
  note?: string;
}

interface ShipperCbmTableProps {
  shipments: ShipmentDetail[];
  onRenameShipper?: (oldName: string, newName: string) => Promise<void>;
  onOpenMergeModal?: (duplicates: DuplicateGroup[]) => void;
  onOpenExcelModal?: () => void;
}

export default function ShipperCbmTable({
  shipments,
  onRenameShipper,
  onOpenMergeModal,
  onOpenExcelModal,
}: ShipperCbmTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedShipper, setExpandedShipper] = useState<string | null>(null);
  const [editingShipper, setEditingShipper] = useState<string | null>(null);
  const [newShipperNameInput, setNewShipperNameInput] = useState('');
  
  // SUB-VIEW MODE: 'summary' (Báo cáo tổng hợp Shipper) or 'details' (Chi tiết toàn bộ lô hàng)
  const [subView, setSubView] = useState<'summary' | 'details'>('summary');

  // Group by Shipper Name
  const shipperMap: {
    [key: string]: {
      shipperName: string;
      totalCbm: number;
      totalQuantity: number;
      shipmentCount: number;
      details: ShipmentDetail[];
    };
  } = {};

  shipments.forEach((item) => {
    const name = item.shipperName.trim();
    const key = name.toUpperCase();

    if (!shipperMap[key]) {
      shipperMap[key] = {
        shipperName: name,
        totalCbm: 0,
        totalQuantity: 0,
        shipmentCount: 0,
        details: [],
      };
    }

    shipperMap[key].totalCbm += item.cbm;
    shipperMap[key].totalQuantity += item.quantity;
    shipperMap[key].shipmentCount += 1;
    shipperMap[key].details.push(item);
  });

  const shipperList = Object.values(shipperMap)
    .sort((a, b) => b.totalCbm - a.totalCbm)
    .filter((s) => s.shipperName.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalAllCbm = shipperList.reduce((sum, s) => sum + s.totalCbm, 0);

  // Filtered raw shipments for 'details' view
  const filteredRawShipments = shipments.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.shipperName.toLowerCase().includes(term) ||
      (item.bookingNo && item.bookingNo.toLowerCase().includes(term)) ||
      (item.contNo && item.contNo.toLowerCase().includes(term)) ||
      (item.destination && item.destination.toLowerCase().includes(term))
    );
  });

  // Detect duplicate/similar names
  const allShipperNames = shipperList.map((s) => s.shipperName);
  const duplicatesDetected = findDuplicateShipperNames(allShipperNames);

  const toggleExpand = (name: string) => {
    setExpandedShipper(expandedShipper === name ? null : name);
  };

  const handleStartRename = (e: React.MouseEvent, currentName: string) => {
    e.stopPropagation();
    setEditingShipper(currentName);
    setNewShipperNameInput(currentName);
  };

  const handleSaveRename = async (e: React.FormEvent, oldName: string) => {
    e.preventDefault();
    if (!newShipperNameInput.trim() || newShipperNameInput.trim() === oldName) {
      setEditingShipper(null);
      return;
    }
    if (onRenameShipper) {
      await onRenameShipper(oldName, newShipperNameInput.trim());
    }
    setEditingShipper(null);
  };

  // EXPORT TO EXCEL FEATURE - ONLY 3 COLUMNS: STT, TÊN SHIPPER, TỔNG CBM
  const handleExportExcel = () => {
    if (shipperList.length === 0) return;

    // Prepare table data with 3 exact columns
    const excelData = shipperList.map((shipper, index) => ({
      'STT': index + 1,
      'Tên Shipper': shipper.shipperName,
      'Tổng CBM (m³)': parseFloat(shipper.totalCbm.toFixed(2)),
    }));

    // Append Summary Total Row at the bottom
    excelData.push({
      'STT': 'TỔNG CỘNG' as any,
      'Tên Shipper': '',
      'Tổng CBM (m³)': parseFloat(totalAllCbm.toFixed(2)),
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto set column widths for clean formatting
    worksheet['!cols'] = [
      { wch: 10 }, // STT
      { wch: 35 }, // Tên Shipper
      { wch: 20 }, // Tổng CBM
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bao_Cao_CBM');

    const fileName = `Bao_Cao_Tong_CBM_Shipper_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Duplicate Warning Banner */}
      {duplicatesDetected.length > 0 && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-amber-950">
                Phát hiện {duplicatesDetected.length} nhóm Shipper có tên gần giống nhau!
              </span>
              <span className="text-amber-800 ml-1">
                (Ví dụ: <code className="bg-amber-100 font-bold px-1 rounded">{duplicatesDetected[0].originalName1}</code> và <code className="bg-amber-100 font-bold px-1 rounded">{duplicatesDetected[0].originalName2}</code>)
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenMergeModal && onOpenMergeModal(duplicatesDetected)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all"
          >
            <GitMerge className="w-4 h-4" />
            <span>Kiểm Tra & Gộp Tên Shipper</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              {subView === 'summary' ? 'Báo Cáo Tổng Số CBM Theo Shipper' : 'Chi Tiết Danh Sách Các Lô Hàng'}
            </h3>
          </div>
        </div>

        {/* Search, Sub-view Toggle & Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={subView === 'summary' ? 'Tìm tên Shipper...' : 'Tìm Shipper, Mã BK, Cont...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56 bg-slate-50/50"
            />
          </div>

          {/* SUB-TAB TOGGLE: CHI TIẾT LÔ HÀNG (Bên cạnh nút Xuất Báo Cáo) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setSubView('summary')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                subView === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Tổng Hợp</span>
            </button>

            <button
              onClick={() => setSubView('details')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                subView === 'details'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Chi Tiết Lô Hàng ({shipments.length})</span>
            </button>
          </div>

          {/* UPLOAD & EXPORT EXCEL BUTTONS */}
          {onOpenExcelModal && (
            <button
              onClick={onOpenExcelModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shrink-0"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Tải File Excel</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            disabled={shipperList.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        {subView === 'summary' ? (
          /* SUMMARY TABLE BY SHIPPER */
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">STT</th>
                <th className="px-5 py-3.5">Tên Shipper</th>
                <th className="px-5 py-3.5 text-center">Số Lô Hàng</th>
                <th className="px-5 py-3.5 text-right font-black text-slate-900">TỔNG CBM (m³)</th>
                <th className="px-5 py-3.5 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipperList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Chưa có dữ liệu Shipper cho khoảng thời gian chọn
                  </td>
                </tr>
              ) : (
                shipperList.map((shipper, idx) => {
                  const isExpanded = expandedShipper === shipper.shipperName;
                  const isEditing = editingShipper === shipper.shipperName;

                  return (
                    <React.Fragment key={idx}>
                      <tr
                        onClick={() => toggleExpand(shipper.shipperName)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-4 text-center font-bold">
                          {idx === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black mx-auto">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black mx-auto">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold mx-auto">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400">{idx + 1}</span>
                          )}
                        </td>

                        {/* Shipper Name Column with Quick Inline Edit */}
                        <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                          {isEditing ? (
                            <form
                              onSubmit={(e) => handleSaveRename(e, shipper.shipperName)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={newShipperNameInput}
                                onChange={(e) => setNewShipperNameInput(e.target.value)}
                                className="px-2 py-1 border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                              >
                                Lưu
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{shipper.shipperName}</span>
                              <button
                                onClick={(e) => handleStartRename(e, shipper.shipperName)}
                                title="Sửa tên Shipper này"
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-slate-600">
                          {shipper.shipmentCount} lô
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-base font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 inline-block">
                            {shipper.totalCbm.toFixed(2)} m³
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Shipment Details Subtable */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                              <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                                <span>Chi Tiết Các Lô Đóng Hàng Của {shipper.shipperName}:</span>
                                <span className="text-slate-500 font-normal">
                                  Số lô: {shipper.details.length}
                                </span>
                              </div>
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                  <tr>
                                    <th className="p-2">Ngày đóng cont</th>
                                    <th className="p-2">Số Cont</th>
                                    <th className="p-2">Mã BK (Booking)</th>
                                    <th className="p-2">Cảng đích</th>
                                    <th className="p-2 text-center">Số lượng</th>
                                    <th className="p-2 text-right">Số CBM</th>
                                    <th className="p-2">Ghi chú</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {shipper.details.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                      <td className="p-2 font-medium">{item.shipmentDate}</td>
                                      <td className="p-2 font-bold">{item.contNo || '-'}</td>
                                      <td className="p-2 font-bold text-blue-700">{item.bookingNo || '-'}</td>
                                      <td className="p-2">{item.destination}</td>
                                      <td className="p-2 text-center font-medium">{item.quantity}</td>
                                      <td className="p-2 text-right font-bold text-blue-700">
                                        {item.cbm.toFixed(2)} m³
                                      </td>
                                      <td className="p-2 font-semibold text-slate-500">{item.note || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Total */}
            <tfoot className="bg-slate-100/80 font-extrabold text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td colSpan={2} className="px-5 py-4 text-slate-900 uppercase">
                  TỔNG CỘNG TOÀN BỘ SHIPPER
                </td>
                <td className="px-5 py-4 text-center">
                  {shipperList.reduce((sum, s) => sum + s.shipmentCount, 0)} lô
                </td>
                <td className="px-5 py-4 text-right text-lg font-black text-blue-700">
                  {totalAllCbm.toFixed(2)} m³
                </td>
                <td className="px-5 py-4 text-center text-xs text-slate-500 font-semibold">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          /* DETAILED RAW SHIPMENTS TABLE */
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-4 py-3.5">Ngày đóng cont</th>
                <th className="px-4 py-3.5">Số Cont</th>
                <th className="px-4 py-3.5">Mã BK (Booking)</th>
                <th className="px-4 py-3.5">Tên Shipper / Chủ Hàng</th>
                <th className="px-4 py-3.5 text-center">Số lượng</th>
                <th className="px-4 py-3.5 text-right font-black text-slate-900">CBM (m³)</th>
                <th className="px-4 py-3.5">Cảng đích</th>
                <th className="px-4 py-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRawShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Chưa có lô hàng chi tiết nào cho tìm kiếm hoặc khoảng thời gian chọn
                  </td>
                </tr>
              ) : (
                filteredRawShipments.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.shipmentDate}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.contNo || '-'}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{item.bookingNo || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.shipperName}</td>
                    <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">{item.cbm.toFixed(2)} m³</td>
                    <td className="px-4 py-3 text-slate-600">{item.destination}</td>
                    <td className="px-4 py-3 text-slate-400">{item.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/80 font-extrabold text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="px-4 py-4 uppercase">
                  TỔNG CỘNG ({filteredRawShipments.length} LÔ HÀNG)
                </td>
                <td className="px-4 py-4 text-center">
                  {filteredRawShipments.reduce((sum, i) => sum + i.quantity, 0)}
                </td>
                <td className="px-4 py-4 text-right text-lg font-black text-emerald-700">
                  {filteredRawShipments.reduce((sum, i) => sum + i.cbm, 0).toFixed(2)} m³
                </td>
                <td colSpan={2} className="px-4 py-4"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
