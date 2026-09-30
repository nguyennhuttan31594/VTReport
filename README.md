# VT REPORT - Báo Cáo Sản Lượng CBM Logistics

Ứng dụng web báo cáo nhanh sản lượng mét khối (CBM) theo Shipper dành cho Kho Đóng Hàng Logistics Cát Lái.

## Tính Năng Chính
- Import file Excel Biên bản đóng hàng tự động
- Loại bỏ các lô hàng hủy (CANCEL) và dừng đọc chính xác ở dòng Tổng cộng
- Tính toán tổng CBM theo từng Shipper
- Phát hiện tên Shipper gõ nhầm/viết tắt và hỗ trợ gộp 1-click
- Xuất báo cáo chuẩn Excel 3 cột: STT, Tên Shipper, Tổng CBM (m³)
- Thiết kế đa tab mở rộng báo cáo trong tương lai

## Công Nghệ
- Next.js 16 (App Router)
- React 19 & TypeScript
- Tailwind CSS v4
- Supabase Database
- SheetJS (xlsx)
