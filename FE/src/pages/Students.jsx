import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { exportStudentListPDF } from '../utils/pdfExport';
import { getAutoColumnWidths } from '../utils/excelExport';
import { Plus, Search, Edit2, Trash2, Download, X, Check, FileSpreadsheet, Upload, Mail, Phone, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import { parseExcel } from '../utils/excelImport';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

const getNextCode = (items, fallbackPrefix) => {
    const parsed = items
        .map(item => String(item.id || '').trim().match(/^(.*?)(\d+)$/))
        .filter(Boolean)
        .filter(match => match[1].toUpperCase() === fallbackPrefix.toUpperCase())
        .map(match => ({
            prefix: match[1],
            number: parseInt(match[2], 10),
            width: match[2].length,
        }))
        .filter(item => Number.isFinite(item.number));

    if (parsed.length === 0) return `${fallbackPrefix}001`;

    const latest = parsed.reduce((max, item) => item.number > max.number ? item : max, parsed[0]);
    return `${latest.prefix}${String(latest.number + 1).padStart(latest.width, '0')}`;
};

function StudentModal({ student, classes, defaultId, onClose, onSave }) {
    const [form, setForm] = useState({
        id: student?.id || defaultId || '',
        name: student?.name || '',
        gender: student?.gender || 'Nam',
        dob: student?.dob || '',
        phone: student?.phone || '',
        email: student?.email || '',
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Học phần</label>
                        <select className="input" value={form.classId} onChange={e => handle('classId', e.target.value)}>
                            <option value="">-- Chọn học phần --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name || c.id}</option>
                            ))}
                        </select>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input className="input" type="email" value={form.email} onChange={e => handle('email', e.target.value)} placeholder="example@email.com" />
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
    const [selectedClass, setSelectedClass] = useState(null);
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const nextStudentId = getNextCode(students, 'HS');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stdRes, clsRes] = await Promise.all([
                api.get('/students'),
                api.get('/classes')
            ]);
            setStudents(stdRes);
            setClasses(clsRes);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Admin: tất cả học sinh lọc theo search
    const filtered = students.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.id || '').includes(search)
    );

    // Teacher: học sinh của lớp đang chọn, lọc theo search
    const getClassStudents = (cls) =>
        students.filter(s => s.classId && s.classId.split(',').map(id => id.trim()).includes(cls.id));

    const filteredClassStudents = selectedClass
        ? getClassStudents(selectedClass).filter(s =>
            (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.id || '').includes(search)
          )
        : [];
    const adminPagination = usePagination(filtered, { resetKeys: [search] });
    const classPagination = usePagination(filteredClassStudents, { resetKeys: [search, selectedClass?.id] });

    const handleSelectClass = (cls) => {
        setSelectedClass(cls);
        setSearch('');
    };

    const handleBackToClasses = () => {
        setSelectedClass(null);
        setSearch('');
    };

    const validateForm = (form, isEdit = false) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!form.name?.trim()) { alert('Vui lòng nhập họ tên sinh viên'); return false; }
        if (!form.id?.trim()) { alert('Vui lòng nhập mã sinh viên'); return false; }
        if (!isEdit && students.some(s => s.id === form.id.trim())) {
            alert('Mã sinh viên "' + form.id + '" đã tồn tại trong danh sách');
            return false;
        }
        if (form.email && !emailRegex.test(form.email)) { alert('Định dạng email không hợp lệ'); return false; }
        if (form.phone && !phoneRegex.test(form.phone)) { alert('Số điện thoại phải từ 10-11 số'); return false; }
        return true;
    };

    const handleSave = async (form) => {
        const isEdit = modal !== 'add';
        if (!validateForm(form, isEdit)) return;
        setLoading(true);
        try {
            if (modal === 'add') {
                const newStudent = await api.post('/students', form);
                setStudents(prev => [...prev, newStudent]);
            } else {
                const updated = await api.put(`/students/${form.id}`, form);
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

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const mapping = {
            'Mã HS': 'id', 'Họ tên': 'name', 'Học phần': 'classId',
            'Giới tính': 'gender', 'Ngày sinh': 'dob', 'Điện thoại': 'phone', 'Email': 'email'
        };
        setLoading(true);
        try {
            const data = await parseExcel(file, mapping);
            const errors = [];
            const seenIds = new Set();
            const existingIds = new Set(students.map(s => s.id));
            data.forEach((row, i) => {
                const line = i + 1;
                if (!row.id?.toString().trim()) {
                    errors.push(`Dòng ${line}: Mã HS không được để trống`);
                } else {
                    const id = row.id.toString().trim();
                    if (seenIds.has(id)) errors.push(`Dòng ${line}: Mã HS "${id}" bị trùng trong file`);
                    else if (existingIds.has(id)) errors.push(`Dòng ${line}: Mã HS "${id}" đã tồn tại trong hệ thống`);
                    seenIds.add(id);
                }
                if (!row.name?.toString().trim()) errors.push(`Dòng ${line}: Họ tên không được để trống`);
            });
            if (errors.length > 0) {
                alert('Lỗi dữ liệu:\n' + errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n...và ${errors.length - 10} lỗi khác` : ''));
                return;
            }
            await api.post('/students/bulk', data);
            alert('Import thành công ' + data.length + ' học sinh');
            fetchData();
        } catch (error) {
            alert('Lỗi Import: ' + error.message);
        } finally {
            setLoading(false);
            e.target.value = null;
        }
    };

    const exportExcel = (list, fileName) => {
        const exportData = list.map((s, i) => ({
            'STT': i + 1, 'Mã HS': s.id, 'Họ tên': s.name,
            'Giới tính': s.gender, 'Ngày sinh': s.dob,
            'Điện thoại': s.phone, 'Email': s.email
        }));
        import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = getAutoColumnWidths(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh');
            XLSX.writeFile(wb, fileName);
        });
    };

    const renderStudentTable = (list, showActions) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="table-head">
                    <tr>
                        <th className="text-left p-4">Học sinh</th>
                        <th className="text-left p-4">Mã HS</th>
                        <th className="text-left p-4">Giới tính</th>
                        <th className="text-left p-4">Ngày sinh</th>
                        <th className="text-left p-4">Liên hệ</th>
                        {showActions && <th className="px-6 py-4 text-right">Hành động</th>}
                    </tr>
                </thead>
                <tbody>
                    {list.map(s => (
                        <tr key={s.id} className="table-row">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                        {s.name ? s.name.split(' ').pop()[0] : '?'}
                                    </div>
                                    <span className="font-medium text-gray-800">{s.name}</span>
                                </div>
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-xs">{s.id}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.gender === 'Nữ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {s.gender || 'Nam'}
                                </span>
                            </td>
                            <td className="p-4 text-gray-500">{s.dob}</td>
                            <td className="p-4 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Mail size={12} className="text-gray-400" />{s.email || '—'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Phone size={12} className="text-gray-400" />{s.phone || '—'}
                                </div>
                            </td>
                            {showActions && (
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => setModal(s)} className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all">
                                            <Edit2 size={13} />
                                        </button>
                                        <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {list.length === 0 && (
                        <tr>
                            <td colSpan={showActions ? 6 : 5} className="text-center py-8 text-gray-400">
                                Không có học sinh
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── VIEW ADMIN ── */}
            {!isTeacher && (
                <>
                    {/* Toolbar admin */}
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
                        <button className="btn-secondary" onClick={() => exportStudentListPDF(filtered)}>
                            <Download size={15} /> PDF
                        </button>
                        <button className="btn-secondary border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => exportExcel(filtered, 'danh_sach_hoc_sinh_tat_ca.xlsx')}>
                            <FileSpreadsheet size={15} /> Excel
                        </button>
                        <label className="btn-secondary border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer">
                            <Upload size={15} /> Import
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                        </label>
                        <button className="btn-primary" onClick={() => setModal('add')}>
                            <Plus size={15} /> Thêm học sinh
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">{filtered.length}</span>
                        học sinh
                    </div>
                    <div className="card p-0 overflow-hidden relative min-h-[200px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {renderStudentTable(adminPagination.pageItems, true)}
                        <Pagination {...adminPagination} onPageChange={adminPagination.setPage} onPageSizeChange={adminPagination.setPageSize} />
                    </div>
                </>
            )}

            {/* ── VIEW TEACHER ── */}
            {isTeacher && (
                <>
                    {/* Màn hình 1: Danh sách lớp */}
                    {!selectedClass && (
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            {classes.length === 0 && !loading && (
                                <div className="card text-center py-16 text-gray-400">
                                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">Bạn chưa được phân công dạy lớp nào</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(cls => {
                                    const count = getClassStudents(cls).length;
                                    return (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleSelectClass(cls)}
                                            className="card text-left hover:shadow-lg hover:border-indigo-200 border border-transparent transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-indigo-200 transition-colors">
                                                    {(cls.name || cls.id).substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 truncate">{cls.name || cls.id}</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">Mã: {cls.id}</p>
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <Users size={11} className="text-indigo-400" />
                                                        <span className="text-xs font-semibold text-indigo-600">{count} học sinh</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Màn hình 2: Danh sách học sinh của lớp */}
                    {selectedClass && (
                        <div className="space-y-4">
                            {/* Header lớp + nút quay lại */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBackToClasses}
                                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <ArrowLeft size={16} className="text-gray-600" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                    {(selectedClass.name || selectedClass.id).substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 text-lg leading-tight">{selectedClass.name || selectedClass.id}</h2>
                                    <p className="text-xs text-gray-400">Mã: {selectedClass.id}</p>
                                </div>
                            </div>

                            {/* Toolbar: tìm kiếm + xuất file */}
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
                                <button className="btn-secondary" onClick={() => exportStudentListPDF(filteredClassStudents, { showClassCol: false, className: selectedClass.name || selectedClass.id })}>
                                    <Download size={15} /> PDF
                                </button>
                                <button className="btn-secondary border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => exportExcel(filteredClassStudents, `danh_sach_${(selectedClass.name || selectedClass.id).replace(/\s+/g, '_')}.xlsx`)}>
                                    <FileSpreadsheet size={15} /> Excel
                                </button>
                            </div>

                            {/* Đếm số học sinh */}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">{filteredClassStudents.length}</span>
                                học sinh
                            </div>

                            {/* Bảng học sinh */}
                            <div className="card p-0 overflow-hidden relative min-h-[200px]">
                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {renderStudentTable(classPagination.pageItems, false)}
                                <Pagination {...classPagination} onPageChange={classPagination.setPage} onPageSizeChange={classPagination.setPageSize} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal thêm/sửa (chỉ admin) */}
            {modal && (
                <StudentModal
                    student={modal === 'add' ? null : modal}
                    classes={classes}
                    defaultId={modal === 'add' ? nextStudentId : ''}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}

            {/* Confirm xóa (chỉ admin) */}
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
