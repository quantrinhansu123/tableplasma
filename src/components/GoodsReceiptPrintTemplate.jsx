import { ITEM_TYPES } from '../constants/goodsReceiptConstants';
import { WAREHOUSES } from '../constants/orderConstants';

const getLabel = (list, id) => list.find(item => item.id === id)?.label || id;

const ReceiptItem = ({ receipt, items }) => {
    if (!receipt) return null;

    const totalAmount = items.reduce((sum, i) => sum + (i.total_price || 0), 0);
    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    return (
        <div className="order-print-page" style={{
            padding: '15mm',
            background: 'white',
            color: 'black',
            fontFamily: '"Be Vietnam Pro", "Roboto", sans-serif',
            fontSize: '13px',
            lineHeight: '1.6',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', margin: 0, letterSpacing: '-0.5px' }}>PlasmaVN</h1>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '2px', margin: '4px 0 0' }}>Hệ thống quản lý kho</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>PHIẾU NHẬP KHO</h2>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#444', margin: '2px 0' }}>
                        Mã phiếu: <span style={{ fontWeight: 900, color: '#000' }}>#{receipt.receipt_code}</span>
                    </p>
                    <p style={{ fontSize: '11px', color: '#888' }}>
                        {receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                    </p>
                </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Nhà cung cấp</h3>
                    <p style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0' }}>{receipt.supplier_name}</p>
                </div>
                <div>
                    <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Thông tin nhập kho</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: '#666' }}>Kho nhận:</span> {getLabel(WAREHOUSES, receipt.warehouse_id)}</p>
                        <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: '#666' }}>Người nhận:</span> {receipt.received_by || '—'}</p>
                        <p style={{ margin: 0 }}><span style={{ fontWeight: 700, color: '#666' }}>Ngày nhập:</span> {receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString('vi-VN') : '—'}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                    <tr style={{ background: '#f8f8f8', borderTop: '2px solid #111', borderBottom: '2px solid #111' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', width: '40px' }}>STT</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Loại</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Tên hàng hóa</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Serial</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Trạng thái</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>SL</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>ĐVT</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Đơn giá</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>{(idx + 1).toString().padStart(2, '0')}</td>
                            <td style={{ padding: '8px' }}>{getLabel(ITEM_TYPES, item.item_type)}</td>
                            <td style={{ padding: '8px', fontWeight: 700 }}>{item.item_name}</td>
                            <td style={{ padding: '8px' }}>{item.serial_number || '—'}</td>
                            <td style={{ padding: '8px' }}>{item.item_status || '—'}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 900 }}>{item.quantity}</td>
                            <td style={{ padding: '8px' }}>{item.unit}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN').format(item.unit_price || 0)}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{new Intl.NumberFormat('vi-VN').format(item.total_price || 0)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ borderTop: '2px solid #111' }}>
                        <td colSpan={5} style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, fontSize: '13px' }}>TỔNG CỘNG</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 900, fontSize: '14px' }}>{totalQty}</td>
                        <td></td>
                        <td></td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, fontSize: '14px', color: '#dc2626' }}>
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Note */}
            {receipt.note && (
                <div style={{ marginBottom: '24px', background: '#f9fafb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Ghi chú:</h3>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#555', margin: 0 }}>{receipt.note}</p>
                </div>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center', marginTop: '60px' }}>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '60px' }}>Người lập phiếu</p>
                    <div style={{ width: '120px', height: '1px', background: '#ccc', margin: '0 auto' }}></div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '60px' }}>Thủ kho</p>
                    <div style={{ width: '120px', height: '1px', background: '#ccc', margin: '0 auto' }}></div>
                </div>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '60px' }}>Người duyệt</p>
                    <div style={{ width: '120px', height: '1px', background: '#ccc', margin: '0 auto' }}></div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                <p style={{ fontSize: '9px', color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    PlasmaVN — Hệ thống quản lý kho hàng
                </p>
            </div>
        </div>
    );
};

const GoodsReceiptPrintTemplate = ({ receipt, items }) => {
    if (!receipt) return null;

    return (
        <div className="bulk-print-container">
            <ReceiptItem receipt={receipt} items={items || []} />
        </div>
    );
};

export default GoodsReceiptPrintTemplate;
