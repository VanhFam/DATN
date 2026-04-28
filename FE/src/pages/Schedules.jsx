import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Search, Edit2, Trash2, Calendar, Clock, X, Check, MapPin, Users } from 'lucide-react';

export function Schedules({ user }) {
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    
    const [schedulesList, setSchedulesList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({ id: '', subject: '', classId: '', teacherId: '', dayOfWeek: 'Thứ 2', startTime: '', endTime: '', room: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schRes, clsRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/classes'),
            ]);
            setSchedulesList(schRes);
            setClasses(clsRes);

            // Chỉ admin mới có quyền lấy danh sách giáo viên
            if (!isTeacher) {
                try {
                    const tRes = await api.get('/teachers');
                    setTeachers(tRes);
                } catch {
                    // Bỏ qua nếu không có quyền
                }
            }
        } catch (error) {
            console.error('Failed to fetch schedules data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = schedulesList.filter(s =>
        s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.classId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (!isTeacher && s.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSave = async (e) => {
        e.preventDefault();
        const dayMapping = {
            'Thứ 2': 'MONDAY', 'Thứ 3': 'TUESDAY', 'Thứ 4': 'WEDNESDAY',
            'Thứ 5': 'THURSDAY', 'Thứ 6': 'FRIDAY', 'Thứ 7': 'SATURDAY', 'Chủ Nhật': 'SUNDAY'
        };

        const dataToSave = {
            ...formData,
            dayOfWeek: dayMapping[formData.dayOfWeek] || formData.dayOfWeek,
            teacherId: isTeacher ? user.id : formData.teacherId,
            teacherName: teachers.find(t => t.id === (isTeacher ? user.id : formData.teacherId))?.name || user.name
        };

        setLoading(true);
        try {
            if (editingSchedule) {
                const updated = await api.put(`/schedules/${editingSchedule.id}`, dataToSave);
                setSchedulesList(schedulesList.map(s => s.id === editingSchedule.id ? updated : s));
            } else {
                const created = await api.post('/schedules', dataToSave);
                setSchedulesList([...schedulesList, created]);
            }
            setShowModal(false);
            setEditingSchedule(null);
        } catch (error) {
            alert('Lỗi khi lưu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (s) => {
        setEditingSchedule(s);
        // Map dayOfWeek back to VN for display
        const reverseDayMapping = {
            'MONDAY': 'Thứ 2', 'TUESDAY': 'Thứ 3', 'WEDNESDAY': 'Thứ 4',
            'THURSDAY': 'Thứ 5', 'FRIDAY': 'Thứ 6', 'SATURDAY': 'Thứ 7', 'SUNDAY': 'Chủ Nhật'
        };
        setFormData({
            ...s,
            dayOfWeek: reverseDayMapping[s.dayOfWeek] || s.dayOfWeek
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
                        placeholder={isTeacher ? "Tìm theo học phần..." : "Tìm theo học phần hoặc giáo viên..."}
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {!isTeacher && (
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => { 
                            const autoId = 'SCH-' + Math.floor(1000 + Math.random() * 9000);
                            setEditingSchedule(null); 
                            setFormData({ 
                                id: autoId,
                                subject: '', 
                                classId: '', 
                                teacherId: teachers[0]?.id || '', 
                                dayOfWeek: 'Thứ 2', 
                                startTime: '', 
                                endTime: '', 
                                room: '' 
                            }); 
                            setShowModal(true); 
                        }}
                    >
                        <Plus size={18} /> Tạo lịch dạy
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(day => {
                    const daySchedules = filtered.filter(s => {
                        const vnDay = {
                            'MONDAY': 'Thứ 2', 'TUESDAY': 'Thứ 3', 'WEDNESDAY': 'Thứ 4',
                            'THURSDAY': 'Thứ 5', 'FRIDAY': 'Thứ 6', 'SATURDAY': 'Thứ 7', 'SUNDAY': 'Chủ Nhật'
                        }[s.dayOfWeek] || s.dayOfWeek;
                        return vnDay === day;
                    });
                    if (daySchedules.length === 0) return null;

                    return (
                        <div key={day} className="space-y-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 px-1">
                                <Calendar size={18} className="text-indigo-500" />
                                {day}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {daySchedules.map(sch => (
                                    <div key={sch.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                    {sch.subject.substring(0, 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h4 className="font-extrabold text-gray-800 leading-tight">{sch.subject}</h4>
                                                    <span className="text-[9px] font-mono text-gray-400">{sch.id}</span>
                                                </div>
                                            </div>
                                            {!isTeacher && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(sch)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={13} /></button>
                                                    <button onClick={async () => { 
                                                        if(confirm('Xóa lịch này?')) {
                                                            setLoading(true);
                                                            try {
                                                                await api.delete(`/schedules/${sch.id}`);
                                                                setSchedulesList(schedulesList.filter(s => s.id !== sch.id));
                                                            } catch(e) { alert('Lỗi: ' + e.message); }
                                                            finally { setLoading(false); }
                                                        }
                                                    }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                                <span className="text-gray-400">Mã học phần: <span className="text-indigo-600 ml-1">{sch.classId}</span></span>
                                                <span className="text-gray-400">Phòng: <span className="text-gray-700 ml-1">{sch.room}</span></span>
                                            </div>
                                            <div className="flex items-center gap-4 py-3 border-t border-gray-50 mt-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 font-semibold">
                                                    <Clock size={15} className="text-emerald-500" />
                                                    {sch.startTime} - {sch.endTime}
                                                </div>
                                            </div>
                                            {!isTeacher && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                    <Users size={12} />
                                                    GV: {sch.teacherName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {!loading && filtered.length === 0 && (
                    <div className="card text-center py-20 text-gray-400 border-dashed border-2 bg-transparent">
                        <Calendar size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-medium">Chưa có lịch dạy nào được tạo.</p>
                        <p className="text-xs">Nhấn vào "Tạo lịch học mới" để bắt đầu.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                            <h3 className="text-xl font-bold text-gray-800">{editingSchedule ? 'Sửa lịch học' : 'Tạo lịch mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white p-2 rounded-xl transition-all shadow-sm"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Mã lịch</label>
                                    <input required placeholder="VD: SCH001" className="input" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!editingSchedule} />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Tên học phần</label>
                                    <input 
                                        list="subject-names"
                                        required 
                                        placeholder="Nhập tên học phần..." 
                                        className="input" 
                                        value={formData.subject} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = classes.find(c => c.name === val);
                                            setFormData({ 
                                                ...formData, 
                                                subject: val, 
                                                classId: found ? found.id : formData.classId 
                                            });
                                        }} 
                                    />
                                    <datalist id="subject-names">
                                        {classes.map(c => <option key={c.id} value={c.name}>{c.id}</option>)}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Mã học phần</label>
                                    <input 
                                        list="subject-ids"
                                        required 
                                        placeholder="Nhập mã học phần..." 
                                        className="input" 
                                        value={formData.classId} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            const found = classes.find(c => c.id === val);
                                            setFormData({ 
                                                ...formData, 
                                                classId: val, 
                                                subject: found ? found.name : formData.subject 
                                            });
                                        }} 
                                    />
                                    <datalist id="subject-ids">
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Giáo viên</label>
                                    <select className="input disabled:bg-gray-50 bg-white" disabled={isTeacher} value={isTeacher ? user.id : formData.teacherId} onChange={e => setFormData({ ...formData, teacherId: e.target.value })}>
                                        {isTeacher ? (
                                            <option value={user.id}>{user.name}</option>
                                        ) : (
                                            teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Ngày học</label>
                                    <select className="input" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Phòng học</label>
                                    <input required placeholder="VD: P.101" className="input" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Bắt đầu</label>
                                    <input required type="time" className="input" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Kết thúc</label>
                                    <input required type="time" className="input" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 justify-center">Hủy bỏ</button>
                                <button type="submit" className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                                    <Check size={18} strokeWidth={3} /> {editingSchedule ? 'Lưu cập nhật' : 'Tạo lịch ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
