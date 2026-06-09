import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Calendar, Check, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

export function Semesters() {
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
    const [saving, setSaving] = useState(false);
    const pagination = usePagination(semesters);

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        setLoading(true);
        try {
            const data = await api.get('/semesters');
            setSemesters(data || []);
        } catch (err) {
            console.error('Failed to fetch semesters:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingId(null);
        setForm({ name: '', startDate: '', endDate: '' });
        setShowForm(true);
    };

    const openEdit = (sem) => {
        setEditingId(sem.id);
        setForm({ name: sem.name, startDate: sem.startDate, endDate: sem.endDate });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.startDate || !form.endDate) {
            alert('Vui lòng nhập đầy đủ thông tin học kỳ');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const updated = await api.put(`/semesters/${editingId}`, form);
                setSemesters(prev => prev.map(s => s.id === editingId ? updated : s));
            } else {
                const created = await api.post('/semesters', form);
                setSemesters(prev => [...prev, created]);
            }
            setShowForm(false);
        } catch (err) {
            alert('Lỗi: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            const updated = await api.patch(`/semesters/${id}/activate`);
            setSemesters(prev => prev.map(s => ({ ...s, isActive: s.id === id ? updated.isActive : false })));
        } catch (err) {
            alert('Lỗi kích hoạt học kỳ: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa học kỳ này?')) return;
        try {
            await api.delete(`/semesters/${id}`);
            setSemesters(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert('Lỗi xóa học kỳ: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                <p className="font-bold">Đang tải danh sách học kỳ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="card p-0 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800">Quản lý Học kỳ</h3>
                        <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {semesters.length} học kỳ
                        </span>
                    </div>
                    <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
                        + Thêm học kỳ
                    </button>
                </div>

                {showForm && (
                    <div className="p-6 border-b border-indigo-50 bg-indigo-50/40">
                        <p className="text-sm font-bold text-indigo-700 mb-4">
                            {editingId ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tên học kỳ</label>
                                <input
                                    className="input"
                                    placeholder="VD: Học kỳ 1 (2025-2026)"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.startDate}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày kết thúc</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.endDate}
                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2 text-sm">
                                {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                            </button>
                            <button onClick={() => setShowForm(false)} className="btn-secondary px-6 py-2 text-sm">
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-left">Tên học kỳ</th>
                                <th className="px-6 py-4 text-left">Ngày bắt đầu</th>
                                <th className="px-6 py-4 text-left">Ngày kết thúc</th>
                                <th className="px-6 py-4 text-left">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {semesters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                                        Chưa có học kỳ nào. Nhấn "+ Thêm học kỳ" để bắt đầu.
                                    </td>
                                </tr>
                            ) : pagination.pageItems.map(sem => (
                                <tr key={sem.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700">{sem.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{sem.startDate}</td>
                                    <td className="px-6 py-4 text-gray-500">{sem.endDate}</td>
                                    <td className="px-6 py-4">
                                        {sem.isActive ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                Đang hoạt động
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-400">
                                                Không hoạt động
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            {!sem.isActive && (
                                                <button
                                                    onClick={() => handleActivate(sem.id)}
                                                    title="Kích hoạt"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                >
                                                    <Check size={15} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEdit(sem)}
                                                title="Chỉnh sửa"
                                                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sem.id)}
                                                title="Xóa"
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
            </div>
        </div>
    );
}
