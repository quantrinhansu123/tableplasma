import React from 'react';
import { WAREHOUSES } from '../constants/orderConstants';

const formatNumber = (val) => {
    if (val === null || val === undefined || val === '' || val === 0) return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
};

const getLabel = (list, id) => list.find(item => item.id === id)?.label || id;
const getWarehouseLabel = (id) => WAREHOUSES.find(w => w.id === id)?.label || id;

const ReceiptItem = ({ receipt, items }) => {
    if (!receipt) return null;

    const today = receipt.receipt_date ? new Date(receipt.receipt_date) : new Date(receipt.created_at || Date.now());
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Prepare rows, padding to at least 5 rows for aesthetics if there are few items
    // If the item is a cylinder and has a serial, we treat it similarly, but here the image shows 1 row per serial if needed, 
    // or just 1 row per item if serial isn't strictly separated. Let's list each item.
    const rows = items.map((item, idx) => ({
        stt: idx + 1,
        name: item.item_name || '',
        code: item.serial_number || item.item_type || '',
        unit: item.unit || (item.item_name?.toLowerCase().includes('bình') ? 'Bình' : 'Cái'),
        qtyReq: item.quantity || 0,
        qtyActual: item.quantity || 0, // Assuming actual = req for now
        price: '', // Leaving price blank in the print template unless needed
        totalNote: item.note || '' // Repurposing total column for notes/customers based on the user's image
    }));

    while (rows.length < 5) {
        rows.push({ stt: '', name: '', code: '', unit: '', qtyReq: '', qtyActual: '', price: '', totalNote: '' });
    }

    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    return (
        <div className="order-print-page p-8 bg-white text-black" style={{ fontFamily: '"Times New Roman", serif', fontSize: '13px', lineHeight: '1.6' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-1">
                <div className="text-center" style={{ maxWidth: '300px' }}>
                    <p className="font-bold text-sm" style={{ fontSize: '13px' }}>CÔNG TY CỔ PHẦN</p>
                    <p className="font-bold text-sm" style={{ fontSize: '13px' }}>CÔNG NGHỆ PLASMA VIỆT NAM</p>
                    <p className="text-xs mt-1 italic" style={{ fontSize: '11px' }}>
                        12BT7, khu đô thị Văn Quán - Yên Phúc,<br />P.Hà Đông, TP.Hà Nội.
                    </p>
                </div>
                <div className="text-right" style={{ maxWidth: '280px' }}>
                    <p className="font-bold" style={{ fontSize: '13px' }}>Mẫu số 02 - VT</p>
                    <p className="text-xs italic" style={{ fontSize: '10px' }}>
                        (Ban hành theo Thông tư số 133/2016/TT-BTC<br />
                        Ngày 26/08/2016 của Bộ Tài chính)
                    </p>
                </div>
            </div>

            {/* Title */}
            <div className="text-center my-4">
                <h1 className="text-xl font-bold tracking-wide" style={{ fontSize: '20px' }}>PHIẾU XUẤT KHO</h1>
                <p className="italic text-sm" style={{ fontSize: '13px' }}>
                    Ngày {String(day).padStart(2, '0')} tháng {String(month).padStart(2, '0')} năm {year}
                </p>
                <div className="flex justify-center gap-16 mt-1" style={{ fontSize: '13px' }}>
                    <span>Số: <span className="font-bold">{receipt.receipt_code}</span></span>
                    <span>Nợ: ...............</span>
                    <span>Có: ...............</span>
                </div>
            </div>

            {/* Info */}
            <div className="mb-4 space-y-1" style={{ fontSize: '13px' }}>
                <p>
                    - Họ và tên người nhận hàng: Công ty TNHH Dịch vụ Y Tế Cộng đồng CHS
                </p>
                <p>
                    - Địa chỉ (bộ phận): Hải Âu 02-57 Vinhomes Ocean Park, Xã Gia lâm, TP Hà Nội, Việt Nam
                </p>
                <p>
                    - Lý do xuất kho (nguyên lý): Nhập hàng từ NCC - {receipt.note || `Nhập ${String(totalQty).padStart(2, '0')} sản phẩm`}
                </p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-4" style={{ fontSize: '12px' }}>
                <thead>
                    <tr>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '35px' }}>STT</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom">
                            Tên, nhãn hiệu, quy cách,<br />phẩm chất vật tư, dụng cụ,<br />sản phẩm, hàng hóa
                        </th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '90px' }}>Mã số</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '55px' }}>Đơn vị<br />tính</th>
                        <th colSpan={2} className="border border-black px-2 py-1 text-center">Số lượng</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '80px' }}>Đơn giá</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '120px' }}>Thành tiền</th>
                    </tr>
                    <tr>
                        <th className="border border-black px-2 py-1 text-center" style={{ width: '55px' }}>Yêu<br />cầu</th>
                        <th className="border border-black px-2 py-1 text-center" style={{ width: '55px' }}>Thực<br />xuất</th>
                    </tr>
                    <tr style={{ fontSize: '11px' }}>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">A</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">B</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">C</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">D</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">1</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">2</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">3</th>
                        <th className="border border-black px-1 py-0.5 text-center font-normal">4</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td className="border border-black px-2 py-1.5 text-center">{row.stt}</td>
                            <td className="border border-black px-2 py-1.5">{row.name}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.code}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-1.5 text-center"></td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.qtyActual !== '' ? String(row.qtyActual).padStart(2, '0') : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.price !== '' ? formatNumber(row.price) : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-left">{row.totalNote}</td>
                        </tr>
                    ))}
                    {/* Total row */}
                    <tr className="font-bold">
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5 text-center font-bold">Cộng:</td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5 text-center font-bold">{String(totalQty).padStart(2, '0')}</td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5"></td>
                    </tr>
                </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-5 gap-2 text-center mt-4" style={{ fontSize: '12px' }}>
                <div>
                    <p className="font-bold">Người lập phiếu</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold">Người nhận hàng</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold">Thủ kho</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold">Kế toán trưởng</p>
                    <p className="italic text-xs">(Hoặc bộ phận có<br />nhu cầu nhập)</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div>
                    <p className="font-bold">Giám đốc</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
};

const GoodsReceiptPrintTemplate = ({ receipt, items }) => {
    if (!receipt) return null;
    const receiptList = Array.isArray(receipt) ? receipt : [receipt];

    // Fallback if bulk print is needed later
    const itemsList = Array.isArray(items) ? items : [];

    return (
        <div className="bulk-print-container">
            {receiptList.map((r, index) => (
                <React.Fragment key={r.id || index}>
                    <ReceiptItem receipt={r} items={itemsList} />
                    {index < receiptList.length - 1 && <div className="page-break" />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default GoodsReceiptPrintTemplate;
