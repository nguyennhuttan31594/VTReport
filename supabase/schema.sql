-- ========================================================
-- BẢNG DỮ LIỆU SHIPPER & CBM (VT REPORT LOGISTICS)
-- Tiền tố bảng: VTREPORT_
-- ========================================================

DROP TABLE IF EXISTS "VTREPORT_shipment_details" CASCADE;

CREATE TABLE "VTREPORT_shipment_details" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cont_no VARCHAR(100),
    booking_no VARCHAR(100),
    shipper_name VARCHAR(255) NOT NULL,
    cbm NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity NUMERIC(10, 2) DEFAULT 0,
    destination VARCHAR(100),
    vessel VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BẬT ROW LEVEL SECURITY & POLICY PERMISSIONS
ALTER TABLE "VTREPORT_shipment_details" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on VTREPORT_shipment_details" ON "VTREPORT_shipment_details" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on VTREPORT_shipment_details" ON "VTREPORT_shipment_details" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on VTREPORT_shipment_details" ON "VTREPORT_shipment_details" FOR DELETE USING (true);

-- THÊM DỮ LIỆU MẪU ĐÚNG THEO FILE EXCEL BIÊN BẢN ĐÓNG HÀNG (KHO 1 CÁT LÁI)
INSERT INTO "VTREPORT_shipment_details" (shipment_date, cont_no, booking_no, destination, shipper_name, quantity, cbm, note) VALUES
('2026-09-10', 'SEGU1878290', '0008', 'HKG', 'ITOCHU', 22, 1.68, 'combine B/L'),
('2026-09-10', 'SEGU1878290', '0059', 'HKG', 'ITOCHU', 30, 4.57, 'combine B/L'),
('2026-09-10', 'SEGU1878290', '0103', 'HKG', 'KINTETSU', 5, 5.02, 'KO MOC HUN TRUNG'),
('2026-09-10', 'SEGU1878290', '0228A', 'HKG', 'KCI', 2, 3.04, NULL),
('2026-09-10', 'SEGU1878290', '0228B', 'HKG', 'KCI', 7, 1.00, NULL),
('2026-09-10', 'SEGU1878290', '0228C', 'HKG', 'KCI', 2, 1.00, NULL),
('2026-09-10', 'SEGU1878290', '0228D', 'HKG', 'KCI', 20, 1.23, NULL),
('2026-09-10', 'SEGU1878290', '0228E', 'HKG', 'KCI', 5, 2.02, NULL),
('2026-09-10', 'SEGU1878290', '0306', 'HKG', 'TIMES CARGO', 3, 3.69, 'KO CHONG HANG'),
('2026-09-10', 'SEGU1878290', '0577', 'SOUTH MANILA', 'CARGO RUSH', 27, 2.15, NULL),

-- Dữ liệu các đợt tiếp theo để thống kê theo Tuần/Tháng
('2026-09-18', 'TGBU1234567', '0412', 'HKG', 'ITOCHU', 40, 8.20, 'Đóng cont đợt 2'),
('2026-09-24', 'TGBU1234567', '0415', 'HKG', 'KINTETSU', 15, 6.40, NULL),
('2026-09-28', 'OOLU9876543', '0501', 'SOUTH MANILA', 'KCI', 35, 9.50, NULL),
('2026-10-05', 'OOLU9876543', '0610', 'HKG', 'TIMES CARGO', 50, 12.30, 'Lô tháng 10');
