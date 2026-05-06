import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { exportDailyAttendanceExcel } from '../utils/excelExport'; 
import { Plus, Search, Edit2, Trash2, Download, X, Check, FileSpreadsheet } from 'lucide-react';

function StudentModal({ student, classes, onClose, onSave, isTeacher }) {
    const [form, setForm] = useState({
        id: student?.id || '',
        name: student?.name || '',
        gender: student?.gender || 'Nam',
        dob: student?.dob || '',
        phone: student?.phone || '',
        classId: student?.classId || ''
    });
    const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-lg">{student ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
                        <input className="input" value={form.id} onChange={e => handle('id', e.target.value)} placeholder="HS001" disabled={!!student} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <input className="input" value={form.name} onChange={e => handle('name', e.target.value)} placeholder="Nguyễn Văn A" />
                    </div>

                    {/* Học phần: Admin chỉ xem, Giáo viên có thể chọn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Học phần {isTeacher && <span className="text-red-500">*</span>}
                        </label>
                        {isTeacher ? (
                            <select className="input" value={form.classId} onChange={e => handle('classId', e.target.value)}>
                                <option value="">-- Chọn học phần --</option>
                                {classes.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="input bg-gray-50 text-gray-500 flex flex-wrap gap-1 min-h-[40px]">
                                {form.classId
                                    ? form.classId.split(',').map(c => (
                                        <span key={c} className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {c.trim()}
                                        </span>
                                    ))
                                    : <span className="text-gray-400 text-sm">Chưa được gán vào học phần nào</span>
                                }
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                            <select className="input" value={form.gender} onChange={e => handle('gender', e.target.value)}>
                                <option>Nam</option>
                                <option>Nữ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                            <input type="date" className="input" value={form.dob} onChange={e => handle('dob', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input className="input" value={form.phone} onChange={e => handle('phone', e.target.value)} placeholder="09xxxxxxxx" />
                    </div>
                </div>
                <div className="flex gap-3 p-6 pt-0">
                    <button onClick={onClose} className="btn-secondary flex-1 justify-center">Hủy</button>
                    <button onClick={() => onSave(form)} className="btn-primary flex-1 justify-center">
                        <Check size={15} /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}


export function Students({ user }) {
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('Tất cả');
    const [modal, setModal] = useState(null); 
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stdRes, clsRes] = await Promise.all([
                api.get('/students'),
                api.get('/classes')
            ]);
            setStudents(stdRes);
            setClasses(clsRes.map(c => c.id));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search)
    );

    const validateForm = (form) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,11}$/;

        if (!form.name || !form.id) {
            alert('Vui lòng nhập tên và mã sinh viên');
            return false;
        }
        if (form.email && !emailRegex.test(form.email)) {
            alert('Định dạng email không hợp lệ');
            return false;
        }
        if (form.phone && !phoneRegex.test(form.phone)) {
            alert('Số điện thoại phải từ 10-11 số');
            return false;
        }
        return true;
    };

    const handleSave = async (form) => {
        if (!validateForm(form)) return;
        setLoading(true);
        const payload = {
            ...form
        };

        try {
            if (modal === 'add') {
                const newStudent = await api.post('/students', payload);
                setStudents(prev => [...prev, newStudent]);
            } else {
                const updated = await api.put(`/students/${form.id}`, payload);
                setStudents(prev => prev.map(s => s.id === form.id ? updated : s));
            }
            setModal(null);
        } catch (error) {
            alert('Lỗi khi lưu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/students/${id}`);
            setStudents(prev => prev.filter(s => s.id !== id));
            setDeleteId(null);
        } catch (error) {
            alert('Lỗi khi xóa: ' + error.message);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Toolbar */}
            <div className="card flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="input pl-8"
                        placeholder="Tìm theo tên hoặc mã..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-secondary border-emerald-200 text-emerald-600 hover:bg-emerald-50" 
                    onClick={() => {
                        const data = filtered.map((s, i) => ({
                            'STT': i + 1,
                            'Mã HS': s.id,
                            'Họ tên': s.name,
                            'Học phần': s.classId,
                            'Giới tính': s.gender,
                            'Ngày sinh': s.dob,
                            'Điện thoại': s.phone
                        }));
                        import('xlsx').then(XLSX => {
                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Danh sách học sinh");
                            XLSX.writeFile(wb, `danh_sach_hoc_sinh_${filterClass}.xlsx`);
                        });
                    }}>
                    <FileSpreadsheet size={15} /> Excel
                </button>
                {/* Nút thêm học sinh: chỉ Admin */}
                {!isTeacher && (
                    <button className="btn-primary" onClick={() => setModal('add')}>
                        <Plus size={15} /> Thêm học sinh
                    </button>
                )}
            </div>

            {/* Summary */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">{filtered.length}</span>
                học sinh trong hệ thống
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden relative min-h-[200px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="text-left p-4">Học sinh</th>
                                <th className="text-left p-4">Mã HS</th>
                                <th className="text-left p-4">Học phần</th>
                                <th className="text-left p-4">Giới tính</th>
                                <th className="text-left p-4">Ngày sinh</th>
                                <th className="text-left p-4">Điện thoại</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="table-row">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                {s.name.split(' ').pop()[0]}
                                            </div>
                                            <span className="font-medium text-gray-800">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-xs">{s.id}</td>
                                    <td className="p-4">
                                        <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded">{s.classId || '—'}</span>
                                    </td>
                                    <td className="p-4 text-gray-500">{s.gender}</td>
                                    <td className="p-4 text-gray-500">{s.dob}</td>
                                    <td className="p-4 text-gray-500">{s.phone}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {!isTeacher && (
                                                <>
                                                    <button
                                                        onClick={() => setModal(s)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(s.id)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">Không tìm thấy học sinh</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal thêm/sửa */}
            {modal && (
                <StudentModal
                    student={modal === 'add' ? null : modal}
                    classes={classes}
                    isTeacher={isTeacher}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}

            {/* Confirm xóa */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-scale-in">
                        <h3 className="font-semibold text-lg mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-500 text-sm mb-5">Bạn có chắc muốn xóa học sinh này không? Hành động không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button className="btn-secondary flex-1 justify-center" onClick={() => setDeleteId(null)}>Hủy</button>
                            <button className="btn-danger flex-1" onClick={() => handleDelete(deleteId)}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
