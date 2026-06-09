import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Search, Edit2, Trash2, Calendar, Clock, X, Check, MapPin, Users } from 'lucide-react';
import { Pagination } from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

export function Schedules({ user }) {
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    
    const [schedulesList, setSchedulesList] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [semesterFilter, setSemesterFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({ id: '', subject: '', classId: '', teacherId: '', dayOfWeek: 'Thứ 2', startTime: '', endTime: '', room: '', locationId: '', semesterId: '', sessionsCount: '' });
    const [showPicker, setShowPicker] = useState({ start: false, end: false });

    const activeSemester = semesters.find(s => s.isActive);
    const toMinutes = (time = '') => {
        const [h = '0', m = '0'] = String(time).split(':');
        return Number(h) * 60 + Number(m);
    };
    const sortByStartTime = (items) => [...items].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const isMorningSchedule = (schedule) => toMinutes(schedule.startTime) < 12 * 60;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schRes, clsRes, locRes, semRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/classes'),
                api.get('/locations'),
                api.get('/semesters'),
            ]);
            setSchedulesList(schRes);
            setClasses(clsRes);
            setLocations(locRes);
            setSemesters(semRes || []);
            // Tự động chọn học kỳ đang active
            const active = (semRes || []).find(s => s.isActive);
            if (active) setSemesterFilter(String(active.id));

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

    const filtered = schedulesList.filter(s => {
        if (semesterFilter && String(s.semesterId) !== semesterFilter) return false;
        return (
            (s.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.classId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (!isTeacher && (s.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });
    const pagination = usePagination(filtered, { resetKeys: [searchTerm, semesterFilter] });

    const handleSave = async (e) => {
        e.preventDefault();
        const effectiveSemesterId = activeSemester?.id || formData.semesterId || null;
        const dataToSave = {
            ...formData,
            semesterId: effectiveSemesterId,
            dayOfWeek: formData.dayOfWeek,
            teacherId: isTeacher ? user.id : formData.teacherId,
            teacherName: teachers.find(t => t.id === (isTeacher ? user.id : formData.teacherId))?.name || user.name
        };

        // --- Frontend Validation ---
        const start = formData.startTime;
        const end = formData.endTime;
        const room = formData.room?.trim().toUpperCase();
        const teacherId = isTeacher ? user.id : formData.teacherId;
        const classId = formData.classId;
        const day = formData.dayOfWeek;

        if (!start || !end) {
            alert('Vui lòng nhập giờ bắt đầu và giờ kết thúc');
            return;
        }
        if (start >= end) {
            alert('Giờ bắt đầu phải trước giờ kết thúc');
            return;
        }

        const isOverlap = (s1Start, s1End, s2Start, s2End) => s1Start < s2End && s1End > s2Start;

        let conflictMsg = null;
        schedulesList.some(s => {
            if (editingSchedule && s.id === editingSchedule.id) return false;

            // Chỉ kiểm tra xung đột trong cùng học kỳ
            const dtoSem = effectiveSemesterId ? String(effectiveSemesterId) : null;
            const sSem = s.semesterId ? String(s.semesterId) : null;
            if (dtoSem && dtoSem !== sSem) return false;
            if (!dtoSem && sSem) return false;

            const vnDay = {
                'MONDAY': 'Thứ 2', 'TUESDAY': 'Thứ 3', 'WEDNESDAY': 'Thứ 4',
                'THURSDAY': 'Thứ 5', 'FRIDAY': 'Thứ 6', 'SATURDAY': 'Thứ 7', 'SUNDAY': 'Chủ Nhật'
            }[s.dayOfWeek] || s.dayOfWeek;

            if (vnDay !== day) return false;

            if (isOverlap(start, end, s.startTime, s.endTime)) {
                if (s.room?.trim().toUpperCase() === room) {
                    conflictMsg = `Phòng ${room} đã có lịch dạy của lớp ${s.classId} (${s.startTime} - ${s.endTime})`;
                    return true;
                }
                if (s.teacherId === teacherId) {
                    conflictMsg = `Giáo viên đã có lịch dạy lớp ${s.classId} vào khung giờ này`;
                    return true;
                }
                if (s.classId === classId) {
                    conflictMsg = `Lớp ${classId} đã có lịch học vào khung giờ này`;
                    return true;
                }
            }
            return false;
        });

        if (conflictMsg) {
            alert('CẢNH BÁO TRÙNG LỊCH: ' + conflictMsg);
            return;
        }
        // --- End Frontend Validation ---

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
        setFormData({
            ...s,
            dayOfWeek: s.dayOfWeek,
            locationId: s.locationId || '',
            semesterId: activeSemester?.id || s.semesterId || null
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={isTeacher ? "Tìm theo học phần..." : "Tìm theo học phần hoặc giáo viên..."}
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input min-w-[180px]"
                        value={semesterFilter}
                        onChange={e => setSemesterFilter(e.target.value)}
                    >
                        <option value="">Tất cả học kỳ</option>
                        {semesters.map(s => (
                            <option key={s.id} value={String(s.id)}>
                                {s.name}{s.isActive ? ' ✓' : ''}
                            </option>
                        ))}
                    </select>
                </div>
                {!isTeacher && (
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => {
                            const existingNums = schedulesList
                                .map(s => s.id)
                                .filter(id => /^SCH-\d+$/.test(id))
                                .map(id => parseInt(id.replace('SCH-', '')));
                            const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
                            const autoId = 'SCH-' + nextNum;
                            setEditingSchedule(null);
                            setFormData({
                                id: autoId,
                                subject: '',
                                classId: '',
                                teacherId: teachers[0]?.id || '',
                                dayOfWeek: 'Thứ 2',
                                startTime: '',
                                endTime: '',
                                room: '',
                                locationId: locations[0]?.id || '',
                                semesterId: activeSemester ? activeSemester.id : null,
                                sessionsCount: '',
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
                    const daySchedules = pagination.pageItems.filter(s => {
                        const vnDay = {
                            'MONDAY': 'Thứ 2', 'TUESDAY': 'Thứ 3', 'WEDNESDAY': 'Thứ 4',
                            'THURSDAY': 'Thứ 5', 'FRIDAY': 'Thứ 6', 'SATURDAY': 'Thứ 7', 'SUNDAY': 'Chủ Nhật'
                        }[s.dayOfWeek] || s.dayOfWeek;
                        return vnDay === day;
                    });
                    if (daySchedules.length === 0) return null;
                    const sessionGroups = [
                        {
                            key: 'morning',
                            title: 'Buổi sáng',
                            color: 'text-amber-500',
                            items: sortByStartTime(daySchedules.filter(isMorningSchedule)),
                        },
                        {
                            key: 'afternoon',
                            title: 'Buổi chiều',
                            color: 'text-sky-500',
                            items: sortByStartTime(daySchedules.filter(s => !isMorningSchedule(s))),
                        },
                    ].filter(group => group.items.length > 0);

                    return (
                        <div key={day} className="space-y-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 px-1">
                                <Calendar size={18} className="text-indigo-500" />
                                {day}
                            </h3>
                            <div className="space-y-4">
                                {sessionGroups.map(group => (
                                    <div key={`${day}-${group.key}`} className="space-y-2">
                                        <div className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-wider text-gray-500">
                                            <Clock size={14} className={group.color} />
                                            {group.title}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {group.items.map(sch => (
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
                                                {sch.locationId && (
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                                        <MapPin size={12} className="text-indigo-400" />
                                                        {locations.find(l => l.id === sch.locationId)?.name || sch.locationId}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                {!isTeacher && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                        <Users size={12} />
                                                        GV: {sch.teacherName}
                                                    </div>
                                                )}
                                                {sch.sessionsCount > 0 && (
                                                    <span className="ml-auto text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                        {sch.sessionsCount} buổi
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                            ))}
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
            <div className="card p-0 overflow-hidden">
                <Pagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
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
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Vị trí GPS</label>
                                    <select required className="input" value={formData.locationId} onChange={e => setFormData({ ...formData, locationId: e.target.value })}>
                                        <option value="">-- Chọn vị trí --</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.address})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Học kỳ</label>
                                    <select className="input disabled:bg-gray-50" disabled={!!activeSemester} value={formData.semesterId || ''} onChange={e => setFormData({ ...formData, semesterId: e.target.value ? Number(e.target.value) : null })}>
                                        <option value="">-- Không thuộc kỳ nào --</option>
                                        {semesters.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (đang hoạt động)' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">
                                        Số buổi phụ trách
                        
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="VD: 15"
                                        className="input"
                                        value={formData.sessionsCount || ''}
                                        onChange={e => setFormData({ ...formData, sessionsCount: e.target.value ? Number(e.target.value) : null })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Bắt đầu</label>
                                    <div className="relative">
                                        <div className="flex items-center">
                                            <input 
                                                type="text" 
                                                className="input pr-12 font-mono" 
                                                placeholder="HH:mm"
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            />
                                            <button 
                                                type="button"
                                                className="absolute right-2 p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all"
                                                onClick={() => setShowPicker({ ...showPicker, start: !showPicker.start })}
                                            >
                                                <Clock size={18} />
                                            </button>
                                        </div>
                                        
                                        {showPicker.start && (
                                            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-slide-up">
                                                <select 
                                                    className="input-sm w-20 text-center"
                                                    value={formData.startTime.split(':')[0] || '00'}
                                                    onChange={e => {
                                                        const h = e.target.value;
                                                        const m = formData.startTime.split(':')[1] || '00';
                                                        setFormData({ ...formData, startTime: `${h}:${m}` });
                                                    }}
                                                >
                                                    {Array.from({ length: 24 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>
                                                    ))}
                                                </select>
                                                <span className="font-bold text-gray-300">:</span>
                                                <select 
                                                    className="input-sm w-20 text-center"
                                                    value={formData.startTime.split(':')[1] || '00'}
                                                    onChange={e => {
                                                        const m = e.target.value;
                                                        const h = formData.startTime.split(':')[0] || '00';
                                                        setFormData({ ...formData, startTime: `${h}:${m}` });
                                                        setShowPicker({ ...showPicker, start: false }); // Auto-close on minute select
                                                    }}
                                                >
                                                    {Array.from({ length: 60 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}p</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">Kết thúc</label>
                                    <div className="relative">
                                        <div className="flex items-center">
                                            <input 
                                                type="text" 
                                                className="input pr-12 font-mono" 
                                                placeholder="HH:mm"
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            />
                                            <button 
                                                type="button"
                                                className="absolute right-2 p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all"
                                                onClick={() => setShowPicker({ ...showPicker, end: !showPicker.end })}
                                            >
                                                <Clock size={18} />
                                            </button>
                                        </div>
                                        
                                        {showPicker.end && (
                                            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-slide-up">
                                                <select 
                                                    className="input-sm w-20 text-center"
                                                    value={formData.endTime.split(':')[0] || '00'}
                                                    onChange={e => {
                                                        const h = e.target.value;
                                                        const m = formData.endTime.split(':')[1] || '00';
                                                        setFormData({ ...formData, endTime: `${h}:${m}` });
                                                    }}
                                                >
                                                    {Array.from({ length: 24 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>
                                                    ))}
                                                </select>
                                                <span className="font-bold text-gray-300">:</span>
                                                <select 
                                                    className="input-sm w-20 text-center"
                                                    value={formData.endTime.split(':')[1] || '00'}
                                                    onChange={e => {
                                                        const m = e.target.value;
                                                        const h = formData.endTime.split(':')[0] || '00';
                                                        setFormData({ ...formData, endTime: `${h}:${m}` });
                                                        setShowPicker({ ...showPicker, end: false });
                                                    }}
                                                >
                                                    {Array.from({ length: 60 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}p</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
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
