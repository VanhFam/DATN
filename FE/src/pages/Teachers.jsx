import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { UserPlus, Search, Edit2, Trash2, Mail, Phone, BookOpen, X, Check, FileSpreadsheet } from 'lucide-react';
import { exportTeacherListExcel } from '../utils/excelExport';

export function Teachers() {
    const [teachersList, setTeachersList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({ name: '', id: '', email: '', phone: '' });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const tRes = await api.get('/teachers');
            setTeachersList(tRes);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachersList.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateForm = (form) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!form.name || !form.id) {
            alert('Vui lòng nhập tên và mã giáo viên');
            return false;
        }
        if (form.email && !emailRegex.test(form.email)) {
            alert('Email không hợp lệ');
            return false;
        }
        if (form.phone && !phoneRegex.test(form.phone)) {
            alert('Số điện thoại phải từ 10-11 số');
            return false;
        }
        return true;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm(formData)) return;
        
        const payload = {
            ...formData
        };

        setLoading(true);
        try {
            if (editingTeacher) {
                const updated = await api.put(`/teachers/${editingTeacher.id}`, payload);
                setTeachersList(teachersList.map(t => t.id === editingTeacher.id ? updated : t));
            } else {
                const created = await api.post('/teachers', payload);
                setTeachersList([...teachersList, created]);
            }
            setShowModal(false);
            setEditingTeacher(null);
        } catch (error) {
            alert('Lỗi khi lưu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
            try {
                await api.delete(`/teachers/${id}`);
                setTeachersList(teachersList.filter(t => t.id !== id));
            } catch (error) {
                alert('Lỗi khi xóa: ' + error.message);
            }
        }
    };

    const openEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData(teacher);
        setShowModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm giáo viên theo tên hoặc mã..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn-secondary flex items-center gap-2 whitespace-nowrap border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => exportTeacherListExcel(teachersList)}
                    >
                        <FileSpreadsheet size={18} /> Xuất Excel
                    </button>
                    <button
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                        onClick={() => { setEditingTeacher(null); setFormData({ name: '', id: '', email: '', phone: '' }); setShowModal(true); }}
                    >
                        <UserPlus size={18} /> Thêm giáo viên
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden relative min-h-[200px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-gray-100 uppercase text-[11px] font-bold text-gray-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Giáo viên</th>
                            <th className="px-6 py-4">Mã GV</th>
                            <th className="px-6 py-4">Liên hệ</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {teacher.name?.split(' ').pop()[0]}
                                        </div>
                                        <span className="font-semibold text-gray-800">{teacher.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{teacher.id}</td>
                                <td className="px-6 py-4 space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Mail size={12} className="text-gray-400" />
                                        {teacher.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Phone size={12} className="text-gray-400" />
                                        {teacher.phone}
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openEdit(teacher)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(teacher.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredTeachers.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic">Không tìm thấy giáo viên nào.</div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingTeacher ? 'Sửa thông tin' : 'Thêm giáo viên mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-all"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Họ và tên</label>
                                    <input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mã giáo viên</label>
                                    <input required className="input" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!editingTeacher} />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                                    <input required type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Số điện thoại</label>
                                    <input required className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Hủy</button>
                                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Check size={18} /> Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
