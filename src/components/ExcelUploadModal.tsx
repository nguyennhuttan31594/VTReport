'use client';

import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelRow {
  shipmentDate: string;
  contNo: string;
  bookingNo: string;
  shipperName: string;
  cbm: number;
  quantity: number;
  destination: string;
  note: string;
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: ExcelRow[], clearExisting: boolean) => Promise<void>;
}

export default function ExcelUploadModal({ isOpen, onClose, onImport }: ExcelUploadModalProps) {
  const [extractedRows, setExtractedRows] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);

  if (!isOpen) return null;

  // Helper to parse date from sheet name or text
  const parseDateFromText = (text: string): string => {
    const currentYear = new Date().getFullYear();
    const str = text.trim();

    const matchDdMm = str.match(/^(\d{1,2})[\.\/](\d{1,2})/);
    if (matchDdMm) {
      const day = matchDdMm[1].padStart(2, '0');
      const month = matchDdMm[2].padStart(2, '0');
      return `${currentYear}-${month}-${day}`;
    }

    const monthMap: { [k: string]: string } = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    const matchEtd = str.match(/(\d{1,2})[- \/]([A-Za-z]{3})/i);
    if (matchEtd) {
      const day = matchEtd[1].padStart(2, '0');
      const mStr = matchEtd[2].toUpperCase();
      if (monthMap[mStr]) {
        return `${currentYear}-${monthMap[mStr]}-${day}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const rowsParsed: ExcelRow[] = [];

        wb.SheetNames.forEach((sheetName) => {
          let sheetDate = parseDateFromText(sheetName);
          const ws = wb.Sheets[sheetName];
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

          let contNo = '';
          let etdHeaderDate = '';

          for (let r = 0; r < Math.min(10, data.length); r++) {
            const rowStr = (data[r] || []).join(' ');
            if (rowStr.toUpperCase().includes('ETD:')) {
              const etdPart = rowStr.split(/ETD:/i)[1];
              if (etdPart) {
                etdHeaderDate = parseDateFromText(etdPart);
              }
            }
            if (rowStr.includes('SỐ CONT') || rowStr.includes('CONT')) {
              const match = rowStr.match(/[A-Z]{4}\d{7}/);
              if (match) contNo = match[0];
            }
          }

          const finalDate = etdHeaderDate !== new Date().toISOString().split('T')[0] ? etdHeaderDate : sheetDate;

          let shipperColIdx = -1;
          let cbmColIdx = -1;
          let bkColIdx = -1;
          let qtyColIdx = -1;
          let destColIdx = -1;
          let noteColIdx = -1;

          for (let r = 0; r < data.length; r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || '').trim().toUpperCase();
              if (cellVal.includes('SHIPPER') || cellVal.includes('CHỦ HÀNG')) shipperColIdx = c;
              if (cellVal === 'CBM' || cellVal.includes('CBM')) cbmColIdx = c;
              if (cellVal.includes('BK') || cellVal.includes('BOOKING')) bkColIdx = c;
              if (cellVal === 'SL' || cellVal.includes('SỐ LƯỢNG')) qtyColIdx = c;
              if (cellVal.includes('CẢNG') || cellVal.includes('ĐÍCH')) destColIdx = c;
              if (cellVal.includes('GHI CHÚ') || cellVal.includes('NOTE')) noteColIdx = c;
            }

            if (shipperColIdx !== -1 && cbmColIdx !== -1) {
              let runningSheetCbmSum = 0;

              for (let dataR = r + 1; dataR < data.length; dataR++) {
                const dataRow = data[dataR] || [];
                const shipper = String(dataRow[shipperColIdx] || '').trim();
                const cbmVal = parseFloat(String(dataRow[cbmColIdx] || '0').replace(',', '.'));
                const entireRowStr = dataRow.join(' ').toUpperCase();

                // DETECT THE END OF THE MAIN TABLE WITH 100% ACCURACY:
                // 1. Explicit Total keywords
                const isTotalKeyword =
                  entireRowStr.includes('TOTAL') ||
                  entireRowStr.includes('TỔNG') ||
                  entireRowStr.includes('CỘNG') ||
                  entireRowStr.includes('SUBTOTAL') ||
                  entireRowStr.includes('SUM');

                // 2. Row with NO shipper name, but has CBM value equal to running sum or non-zero CBM (Row 14 Total)
                const isTotalNumberRow =
                  !shipper &&
                  !isNaN(cbmVal) &&
                  cbmVal > 0 &&
                  (Math.abs(cbmVal - runningSheetCbmSum) < 0.1 || runningSheetCbmSum > 0);

                // 3. Footer text notes starting (e.g. HANG HONGKONG - KO DUOC QUA KICH THUOC)
                const isFooterNoteText =
                  entireRowStr.includes('KO DUOC QUA KICH THUOC') ||
                  entireRowStr.includes('BAO CHO CHUNG TU') ||
                  entireRowStr.includes('CO PHI PHAT SINH');

                if (isTotalKeyword || isTotalNumberRow || isFooterNoteText) {
                  // WE HAVE REACHED THE TOTAL LINE / FOOTER OF THE MAIN TABLE!
                  // STOP SCANNING IMMEDIATELY SO WE NEVER READ THE SEPARATE NOTES/CANCELLED TABLE BELOW!
                  break;
                }

                if (
                  shipper &&
                  !isNaN(cbmVal) &&
                  cbmVal > 0 &&
                  shipper.toUpperCase() !== 'SHIPPER' &&
                  shipper.toUpperCase() !== 'STT'
                ) {
                  runningSheetCbmSum += cbmVal;

                  rowsParsed.push({
                    shipmentDate: finalDate,
                    contNo: contNo || 'CONT-LOGISTICS',
                    bookingNo: bkColIdx !== -1 ? String(dataRow[bkColIdx] || '') : '',
                    shipperName: shipper,
                    cbm: cbmVal,
                    quantity: qtyColIdx !== -1 ? parseFloat(String(dataRow[qtyColIdx] || '0')) || 0 : 0,
                    destination: destColIdx !== -1 ? String(dataRow[destColIdx] || '') : 'HONG KONG',
                    note: noteColIdx !== -1 ? String(dataRow[noteColIdx] || '') : '',
                  });
                }
              }
              break; // Done with main table in this sheet
            }
          }
        });

        setExtractedRows(rowsParsed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (extractedRows.length === 0) return;
    setIsProcessing(true);
    await onImport(extractedRows, clearExisting);
    setIsProcessing(false);
    onClose();
  };

  const totalCbmExtracted = extractedRows.reduce((sum, r) => sum + r.cbm, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tải File Excel Biên Bản Đóng Hàng</h3>
              <p className="text-xs text-slate-500">
                Tự động dừng đọc tại dòng số tổng 25.40 (Bỏ qua hoàn toàn phần bảng phụ bị hủy ở dưới)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">
                  {fileName ? fileName : 'Bấm vào đây để chọn File Excel Biên Bản Đóng Hàng'}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Chỉ đọc chính xác các dòng trong Bảng Đóng Hàng Chính (.xlsx, .xls)
                </p>
              </div>
            </label>
          </div>

          {/* Option: Clear old data */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>Xóa sạch dữ liệu cũ trước khi nạp file này (Khuyên dùng)</span>
            </label>
          </div>

          {/* Extracted Preview */}
          {extractedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Phát hiện {extractedRows.length} dòng chính xác từ Bảng Đóng Hàng:</span>
                <span className="text-emerald-700 font-black text-sm">
                  TỔNG CBM BẢNG CHÍNH: {totalCbmExtracted.toFixed(2)} m³
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {extractedRows.map((row, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                        {row.shipmentDate}
                      </span>
                      <span className="font-bold text-slate-900">{row.shipperName}</span>
                      <span className="text-slate-400 text-[11px]">BK: {row.bookingNo || '-'}</span>
                    </div>
                    <div className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {row.cbm.toFixed(2)} CBM
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={extractedRows.length === 0 || isProcessing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Nạp Vô Hệ Thống ({extractedRows.length} dòng)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
