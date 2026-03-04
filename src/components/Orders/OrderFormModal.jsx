import { ChevronDown, Edit3, Hash, MapPin, Package, Phone, Save, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    CUSTOMER_CATEGORIES,
    MOCK_CUSTOMERS,
    PRODUCT_TYPES,
    WAREHOUSES
} from '../../constants/orderConstants';
import usePermissions from '../../hooks/usePermissions';
import { supabase } from '../../supabase/config';

export default function OrderFormModal({ order, onClose, onSuccess }) {
    const { role, user } = usePermissions();
    const isEdit = !!order;
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [editReason, setEditReason] = useState('');

    const getNewOrderCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    const defaultState = {
        orderCode: getNewOrderCode(),
        customerCategory: 'TM',
        warehouse: 'HN',
        customerId: '',
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        orderType: 'THUONG',
        note: '',
        productType: 'BINH_4L',
        quantity: 0,
        department: '',
        promotion: ''
    };

    const [formData, setFormData] = useState(defaultState);

    useEffect(() => {
        fetchRealCustomers();
    }, []);

    const fetchRealCustomers = async () => {
        setIsFetchingCustomers(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name', { ascending: true });

            if (error && error.code !== '42P01') throw error;

            if (data && data.length > 0) {
                // Map the DB structure to what the form expects
                const dbCustomers = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    address: c.address,
                    recipient: c.legal_rep || c.name,
                    phone: c.phone,
                    category: c.category
                }));
                // Combine with mock if desired or just use DB
                setCustomers(dbCustomers);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsFetchingCustomers(false);
        }
    };

    useEffect(() => {
        if (isEdit) {
            setFormData({
                orderCode: order.order_code,
                customerCategory: order.customer_category,
                warehouse: order.warehouse,
                customerId: customers.find(c => c.name === order.customer_name)?.id || '',
                recipientName: order.recipient_name,
                recipientAddress: order.recipient_address || '',
                recipientPhone: order.recipient_phone,
                orderType: order.order_type,
                note: order.note || '',
                productType: order.product_type,
                quantity: order.quantity,
                department: order.department || '',
                promotion: order.promotion_code || ''
            });
        }
    }, [order, isEdit, customers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (e) => {
        const customerId = e.target.value;
        const customer = customers.find(c => c.id.toString() === customerId.toString());
        if (customer) {
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                recipientName: customer.recipient,
                recipientAddress: customer.address,
                recipientPhone: customer.phone,
                customerCategory: customer.category
            }));
        } else {
            setFormData(prev => ({ ...prev, customerId: '' }));
        }
    };

    const handleQuantityChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, quantity: value === '' ? 0 : parseInt(value, 10) }));
    };

    const formatNumber = (val) => {
        if (val === null || val === undefined || val === '') return '0';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.customerId || !formData.recipientName || !formData.recipientAddress || !formData.recipientPhone || formData.quantity <= 0) {
            setErrorMsg('Vui lòng điền đầy đủ thông tin bắt buộc và số lượng phải lớn hơn 0.');
            return;
        }

        if (isEdit && !editReason.trim()) {
            setShowReasonModal(true);
            return;
        }

        setIsLoading(true);

        try {
            const customerName = customers.find(c => c.id.toString() === formData.customerId.toString())?.name || '';
            const currentUser = user?.name || user?.email || 'Hệ thống';

            let initialStatus = 'CHO_DUYET';
            if (!isEdit && (role === 'admin' || role === 'thu_kho')) {
                initialStatus = 'DA_DUYET';
            }

            const payload = {
                order_code: formData.orderCode,
                customer_category: formData.customerCategory,
                warehouse: formData.warehouse,
                customer_name: customerName,
                recipient_name: formData.recipientName,
                recipient_address: formData.recipientAddress,
                recipient_phone: formData.recipientPhone,
                order_type: formData.orderType,
                note: formData.note,
                product_type: formData.productType,
                quantity: formData.quantity,
                department: formData.department,
                promotion_code: formData.promotion,
                status: isEdit ? order.status : initialStatus,
                ordered_by: isEdit ? order.ordered_by : currentUser,
                updated_at: new Date().toISOString()
            };

            if (isEdit) {
                const changedFields = {};
                const fieldMap = {
                    customer_name: order.customer_name,
                    recipient_name: order.recipient_name,
                    recipient_address: order.recipient_address,
                    recipient_phone: order.recipient_phone,
                    quantity: order.quantity,
                    note: order.note,
                    order_type: order.order_type,
                    product_type: order.product_type,
                    department: order.department,
                    warehouse: order.warehouse
                };
                Object.entries(fieldMap).forEach(([key, oldVal]) => {
                    const newVal = payload[key];
                    if (String(oldVal || '') !== String(newVal || '')) {
                        changedFields[key] = { old: oldVal || '', new: newVal || '' };
                    }
                });

                const { error } = await supabase
                    .from('orders')
                    .update(payload)
                    .eq('id', order.id);
                if (error) throw error;

                await supabase.from('order_history').insert([{
                    order_id: order.id,
                    action: 'EDITED',
                    changed_fields: Object.keys(changedFields).length > 0 ? changedFields : null,
                    reason: editReason,
                    created_by: currentUser
                }]);
            } else {
                const { data: inserted, error } = await supabase
                    .from('orders')
                    .insert([payload])
                    .select('id');
                if (error) throw error;

                if (inserted && inserted[0]) {
                    await supabase.from('order_history').insert([{
                        order_id: inserted[0].id,
                        action: 'CREATED',
                        new_status: initialStatus,
                        created_by: currentUser
                    }]);
                }
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving order:', error);
            setErrorMsg(error.message || 'Có lỗi xảy ra khi lưu đơn hàng.');
        } finally {
            setIsLoading(false);
        }
    };

    return (<>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50 transition-transform hover:rotate-6">
                            {isEdit ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {isEdit ? 'Chỉnh sửa Đơn hàng' : 'Khởi tạo Đơn hàng'}
                            </h3>
                            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-0.5">
                                Mã đơn: {formData.orderCode}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all duration-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 overflow-y-auto bg-white custom-scrollbar">
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[13px] font-bold text-rose-600 flex items-center gap-3 animate-shake">
                            <X className="w-5 h-5 shrink-0 bg-white rounded-full p-1 shadow-sm" />
                            {errorMsg}
                        </div>
                    )}

                    <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* Section 1: Thông tin định danh */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Thông tin định danh</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        Mã đơn hàng *
                                    </label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            value={formData.orderCode}
                                            disabled
                                            className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 text-sm cursor-not-allowed shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 italic">Được tạo tự động theo quy tắc hệ thống</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chọn Khách hàng *</label>
                                    <div className="relative">
                                        <select
                                            value={formData.customerId}
                                            onChange={handleCustomerChange}
                                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-black text-sm shadow-sm transition-all cursor-pointer appearance-none"
                                            disabled={isFetchingCustomers}
                                        >
                                            <option value="">-- {isFetchingCustomers ? 'Đang tải...' : 'Chọn từ hệ thống'} --</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Loại khách hàng</label>
                                    <select
                                        name="customerCategory"
                                        value={formData.customerCategory}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-sm outline-none transition-all cursor-not-allowed"
                                        disabled
                                    >
                                        {CUSTOMER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ng.Đại diện liên lạc *</label>
                                    <input
                                        name="recipientName"
                                        value={formData.recipientName}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A..."
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Địa chỉ & Ưu tiên */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Địa chỉ & Chi tiết vận hành</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        Số điện thoại liên lạc *
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            name="recipientPhone"
                                            value={formData.recipientPhone}
                                            onChange={handleChange}
                                            placeholder="09xx..."
                                            className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kho xuất hàng *</label>
                                    <div className="relative">
                                        <select
                                            name="warehouse"
                                            value={formData.warehouse}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all cursor-pointer appearance-none"
                                        >
                                            {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Địa chỉ giao hàng chi tiết *</label>
                                    <input
                                        name="recipientAddress"
                                        value={formData.recipientAddress}
                                        onChange={handleChange}
                                        placeholder="Thanh Xuân, Hà Nội..."
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:col-span-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Loại sản phẩm</label>
                                        <select
                                            name="productType"
                                            value={formData.productType}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all appearance-none cursor-pointer"
                                        >
                                            {PRODUCT_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Số lượng *</label>
                                        <input
                                            type="text"
                                            value={formatNumber(formData.quantity)}
                                            onChange={handleQuantityChange}
                                            className="w-full px-5 py-3 bg-blue-50/30 border border-blue-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-black text-lg text-blue-600 shadow-inner text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Khoa / Mã máy sử dụng</label>
                                    <input
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: Khoa mắt - Mã máy MV01"
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-sm shadow-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ưu đãi / Ghi chú</label>
                                    <input
                                        name="promotion"
                                        value={formData.promotion}
                                        onChange={handleChange}
                                        placeholder="KMB02 - Ưu đãi bình mới..."
                                        className="w-full px-5 py-3 bg-amber-50/30 border border-amber-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 font-bold text-sm shadow-sm transition-all text-amber-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 bg-slate-50/10 border-t border-slate-100 shrink-0 flex items-center justify-end gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.02)] relative z-10 font-sans">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest outline-none"
                        disabled={isLoading}
                    >
                        Hủy thoát
                    </button>
                    <button
                        type="submit"
                        form="orderForm"
                        disabled={isLoading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-2.5 border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                        {isEdit ? 'Lưu thay đổi' : 'Xác nhận tạo ĐH'}
                    </button>
                </div>

            </div>
        </div>

        {/* Edit Reason Modal */}
        {
            showReasonModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-black text-gray-900">📝 Lý do chỉnh sửa</h3>
                        <p className="text-sm text-gray-500 font-medium">Vui lòng nhập lý do chỉnh sửa đơn hàng.</p>
                        <textarea
                            rows="3"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="Ví dụ: Khách yêu cầu thay đổi..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-medium text-sm resize-none"
                            autoFocus
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowReasonModal(false)}
                                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (!editReason.trim()) {
                                        alert('Vui lòng nhập lý do!');
                                        return;
                                    }
                                    setShowReasonModal(false);
                                    document.getElementById('orderForm').requestSubmit();
                                }}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                            >
                                Xác nhận & Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    </>);
}
