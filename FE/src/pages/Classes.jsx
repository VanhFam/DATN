import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Search, Edit2, Trash2, Users, BookOpen, X, Check } from 'lucide-react';

export function Classes() {
    const [classList, setClassList] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', id: '', description: '', maxStudents: 50 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clsRes, tRes, stdRes] = await Promise.all([
                api.get('/classes'),
                api.get('/teachers'),
                api.get('/students')
            ]);
            setClassList(clsRes);
            setTeachers(tRes);
            setStudents(stdRes);
        } catch (error) {
            console.error('Failed to fetch credit data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = classList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const dataToSave = {
            id: formData.id,
            name: formData.name,
            description: formData.description,
            maxStudents: formData.maxStudents
        };

        try {
            // 1. Lưu thông tin học phần
            let classData;
            if (editingClass) {
                classData = await api.put(`/classes/${editingClass.id}`, dataToSave);
                setClassList(classList.map(c => c.id === editingClass.id ? classData : c));
            } else {
                classData = await api.post('/classes', dataToSave);
                setClassList([...classList, classData]);
            }

            setShowModal(false);
            setEditingClass(null);
            // Refresh data
            fetchData();
        } catch (error) {
            alert('Lỗi khi lưu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Bạn có chắc chắn muốn xóa học phần này?')) {
            setLoading(true);
            try {
                await api.delete(`/classes/${id}`);
                setClassList(classList.filter(c => c.id !== id));
            } catch (error) {
                alert('Lỗi khi xóa: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const openEdit = (cls) => {
        setEditingClass(cls);
        setFormData({ 
            name: cls.name, 
            id: cls.id, 
            description: cls.description || '', 
            maxStudents: cls.maxStudents || 50
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm học phần theo tên hoặc mã..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    onClick={() => { setEditingClass(null); setFormData({ name: '', id: '', description: '', maxStudents: 50 }); setShowModal(true); }}
                >
                    <Plus size={18} /> Thêm môn học mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {filtered.map((cls) => (
                    <div key={cls.id} className="card hover:border-indigo-200 transition-all group overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                {cls.name.substring(0, 2)}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setShowEnrollmentModal(cls)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Quản lý sĩ số"><Users size={14} /></button>
                                <button onClick={() => openEdit(cls)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="space-y-1 mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Môn: {cls.name}</h3>
                            <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">{cls.id}</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><Users size={14} /> Sĩ số:</span>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                        students.filter(s => s.classId && s.classId.split(',').map(id => id.trim()).includes(cls.id)).length >= (cls.maxStudents || 50)
                                        ? 'text-red-600 bg-red-50'
                                        : 'text-emerald-600 bg-emerald-50'
                                    }`}>
                                        {students.filter(s => s.classId && s.classId.split(',').map(id => id.trim()).includes(cls.id)).length} / {cls.maxStudents || 50}
                                    </span>
                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all ${
                                                students.filter(s => s.classId && s.classId.split(',').map(id => id.trim()).includes(cls.id)).length >= (cls.maxStudents || 50)
                                                ? 'bg-red-500'
                                                : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (students.filter(s => s.classId && s.classId.split(',').map(id => id.trim()).includes(cls.id)).length / (cls.maxStudents || 50)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><BookOpen size={14} /> Mô tả:</span>
                                <span className="font-semibold text-gray-700 truncate ml-4" title={cls.description}>{cls.description || 'Không có mô tả'}</span>
                            </div>

                        </div>
                    </div>
                ))}
                {!loading && filtered.length === 0 && (
                    <div className="col-span-full p-12 text-center text-gray-400 italic">Không tìm thấy học phần nào.</div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                            <h3 className="text-xl font-bold text-gray-800">{editingClass ? 'Cập nhật môn học' : 'Thêm môn học mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white p-2 rounded-xl transition-all shadow-sm"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">Mã môn học</label>
                                        <input required placeholder="VD: THP101" className="input" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">Tên môn học</label>
                                        <input required placeholder="VD: Giải tích 1" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">Giới hạn sĩ số</label>
                                        <input type="number" required className="input" value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">Mô tả</label>
                                        <input className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                </div>

                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 justify-center">Hủy bỏ</button>
                                <button type="submit" className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                                    <Check size={18} strokeWidth={3} /> {editingClass ? 'Lưu thay đổi' : 'Thêm môn học ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Enrollment Management Modal */}
            {showEnrollmentModal && (
                <EnrollmentModal 
                    cls={showEnrollmentModal} 
                    students={students}
                    onClose={() => setShowEnrollmentModal(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}

function EnrollmentModal({ cls, students, onClose, onUpdate }) {
    const [search, setSearch] = useState('');
    
    // Lọc danh sách học sinh đã tham gia và chưa tham gia
    const enrolledStudents = students.filter(s => {
        if (!s.classId) return false;
        return s.classId.split(',').map(id => id.trim()).includes(cls.id);
    });
    
    const availableStudents = students.filter(s => {
        if (!s.classId) return true;
        return !s.classId.split(',').map(id => id.trim()).includes(cls.id);
    });

    const handleAdd = async (student) => {
        if (enrolledStudents.length >= (cls.maxStudents || 50)) {
            alert(`Lớp đã đạt giới hạn sĩ số tối đa (${cls.maxStudents || 50}). Không thể thêm thêm học sinh.`);
            return;
        }
        try {
            let newClassId;
            if (!student.classId || student.classId === 'null' || student.classId === '') {
                newClassId = cls.id;
            } else {
                const ids = student.classId.split(',').map(id => id.trim());
                if (!ids.includes(cls.id)) {
                    ids.push(cls.id);
                }
                newClassId = ids.join(',');
            }
            await api.put(`/students/${student.id}`, { ...student, classId: newClassId });
            onUpdate();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleRemove = async (student) => {
        try {
            if (!student.classId) return;
            const ids = student.classId.split(',').map(id => id.trim()).filter(id => id !== cls.id);
            const newClassId = ids.length > 0 ? ids.join(',') : null;
            await api.put(`/students/${student.id}`, { ...student, classId: newClassId });
            onUpdate();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const filteredAvailable = availableStudents.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Quản lý sĩ số: {cls.name}</h3>
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Sĩ số hiện tại: {enrolledStudents.length}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white p-2 rounded-xl transition-all shadow-sm"><X /></button>
                </div>
                
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {/* Danh sách hiện tại */}
                    <div className="p-6 border-r border-gray-100 flex flex-col">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Check className="text-emerald-500" size={18} /> Học sinh đã tham gia ({enrolledStudents.length})
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {enrolledStudents.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                            {s.name.split(' ').pop()[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{s.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{s.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemove(s)} className="p-2 text-gray-300 hover:text-red-500 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {enrolledStudents.length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-sm italic">Chưa có học sinh nào trong môn này.</div>
                            )}
                        </div>
                    </div>

                    {/* Thêm học sinh */}
                    <div className="p-6 bg-slate-50/30 flex flex-col">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Plus className="text-indigo-500" size={18} /> Thêm học sinh mới
                        </h4>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Tìm theo tên hoặc mã số..." 
                                className="input pl-10" 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredAvailable.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {s.name.split(' ').pop()[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{s.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{s.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleAdd(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            ))}
                            {filteredAvailable.length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-sm italic">Không có học sinh tự do nào.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="btn-primary px-8">Hoàn tất</button>
                </div>
            </div>
        </div>
    );
}
