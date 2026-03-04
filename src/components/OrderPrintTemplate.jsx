import React from 'react';
import {
    PRODUCT_TYPES,
    WAREHOUSES
} from '../constants/orderConstants';

const numberToVietnameseWords = (num) => {
    if (!num || num === 0) return 'Không';
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];

    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return ones[ten] + ' mươi' + (one ? ' ' + (one === 5 ? 'lăm' : one === 1 ? 'mốt' : ones[one]) : '');
    }
    return String(num);
};

const formatNumber = (val) => {
    if (val === null || val === undefined || val === '' || val === 0) return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
};

const OrderItem = ({ order }) => {
    if (!order) return null;

    const getProductLabel = (id) => PRODUCT_TYPES.find(p => p.id === id)?.label || id;
    const getWarehouseLabel = (id) => WAREHOUSES.find(w => w.id === id)?.label || id;

    const serials = order.assigned_cylinders?.filter(Boolean) || [];
    const productLabel = getProductLabel(order.product_type);
    const isBinh = order.product_type?.startsWith('BINH');
    const today = new Date(order.created_at || Date.now());
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Build table rows - each serial = 1 row if bình, else 1 row for the product
    const rows = [];
    if (isBinh && serials.length > 0) {
        serials.forEach((serial, idx) => {
            rows.push({
                stt: idx + 1,
                name: productLabel,
                code: serial,
                unit: 'Bình',
                qty: 1
            });
        });
    } else {
        rows.push({
            stt: 1,
            name: productLabel,
            code: order.department || '',
            unit: isBinh ? 'Bình' : 'Máy',
            qty: order.quantity || 0
        });
    }

    // Pad to minimum 5 rows
    while (rows.length < 5) {
        rows.push({ stt: rows.length + 1, name: '', code: '', unit: '', qty: '' });
    }

    const totalQty = isBinh && serials.length > 0 ? serials.length : (order.quantity || 0);

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
                    <span>Số: <span className="font-bold">{order.order_code}</span></span>
                    <span>Nợ: ...............</span>
                    <span>Có: ...............</span>
                </div>
            </div>

            {/* Info */}
            <div className="mb-4 space-y-1" style={{ fontSize: '13px' }}>
                <p>
                    - Họ và tên người nhận hàng: <strong>{order.customer_name || ''}</strong>
                    {order.recipient_name && order.recipient_name !== order.customer_name && ` (${order.recipient_name})`}
                </p>
                <p>
                    - Địa chỉ (bộ phận): {order.recipient_address || ''}
                </p>
                <p>
                    - Lý do xuất kho (nguyên lý): Xuất {String(totalQty).padStart(2, '0')} {productLabel}
                    {order.department ? ` - ${order.department}` : ''}
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
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center align-bottom" style={{ width: '90px' }}>Thành<br />tiền</th>
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
                            <td className="border border-black px-2 py-1.5 text-center">{row.name ? row.stt : ''}</td>
                            <td className="border border-black px-2 py-1.5">{row.name}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.code}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.qty !== '' ? String(row.qty).padStart(2, '0') : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-center"></td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.qty !== '' && order.unit_price ? formatNumber(order.unit_price) : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.qty !== '' && order.unit_price ? formatNumber(row.qty * order.unit_price) : ''}</td>
                        </tr>
                    ))}
                    {/* Total row */}
                    <tr className="font-bold">
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5 text-center font-bold">Cộng:</td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5 text-center font-bold">{String(totalQty).padStart(2, '0')}</td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5"></td>
                        <td className="border border-black px-2 py-1.5 text-right font-bold">{order.total_amount ? formatNumber(order.total_amount) : ''}</td>
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

const OrderPrintTemplate = ({ orders }) => {
    if (!orders) return null;
    const orderList = Array.isArray(orders) ? orders : [orders];

    return (
        <div className="bulk-print-container">
            {orderList.map((order, index) => (
                <React.Fragment key={order.id || index}>
                    <OrderItem order={order} />
                    {index < orderList.length - 1 && <div className="page-break" />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default OrderPrintTemplate;
