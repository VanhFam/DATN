import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Check, X, Minus, Save, ShieldAlert, FileText, FileSpreadsheet, Clock } from 'lucide-react';
import { exportDailyAttendancePDF } from '../utils/pdfExport';
import { exportDailyAttendanceExcel } from '../utils/excelExport';

const STATUS_LABEL = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn' };
const todayStr = new Date().toISOString().split('T')[0];

function StatusButton({ status, current, onClick, disabled }) {
    const styles = {
        present: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'present' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        absent: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'absent' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        late: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'late' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    };
    return (
        <button className={styles[status]} onClick={disabled ? null : onClick} disabled={disabled}>
            {STATUS_LABEL[status]}
        </button>
    );
}

export function Attendance({ user }) {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [classStudents, setClassStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(true);
    const [isWithinTime, setIsWithinTime] = useState(true);
    const [scheduleInfo, setScheduleInfo] = useState('');

    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const isHistory = selectedDate !== todayStr;
    // Ràng buộc mới: Không cho phép điểm danh quá khứ/tương lai ở cả Client
    const canEdit = !isHistory;

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes');
                setClasses(res.map(c => c.id));
                if (res.length > 0) setSelectedClass(res[0].id);
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchAttendanceData();
        }
    }, [selectedClass, selectedDate]);

    const fetchAttendanceData = async () => {
        setLoading(true);
        setClassStudents([]); // Clear current list while loading
        setAttendance({});   // Clear attendance map while loading
        try {
            const [studentsRes, attendanceRes, schedulesRes] = await Promise.all([
                api.get(`/students/class/${selectedClass}`),
                api.get(`/attendance?classId=${selectedClass}&date=${selectedDate}`),
                api.get('/schedules')
            ]);
            
            // Check if class has schedule on this day
            const dateObj = new Date(selectedDate);
            const dayMap = { 0: 'Chủ Nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' };
            const dayStr = dayMap[dateObj.getDay()];
            
            const classSchedule = schedulesRes.filter(s => s.classId === selectedClass && s.dayOfWeek === dayStr);
            setHasSchedule(classSchedule.length > 0);
            
            if (classSchedule.length > 0) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                
                const within = classSchedule.some(s => {
                    const [sh, sm] = s.startTime.split(':').map(Number);
                    const [eh, em] = s.endTime.split(':').map(Number);
                    const startMin = sh * 60 + sm - 30; // 30p buffer
                    const endMin = eh * 60 + em + 30;
                    return currentMinutes >= startMin && currentMinutes <= endMin;
                });
                
                setIsWithinTime(within || isHistory); // Lịch sử thì luôn true để xem
                setScheduleInfo(classSchedule.map(s => `${s.startTime} - ${s.endTime}`).join(', '));
            } else {
                setIsWithinTime(false);
                setScheduleInfo('');
            }

            setClassStudents(studentsRes);
            
            const records = {};
            // Initialize with default 'present' for all students
            studentsRes.forEach(s => { records[s.id] = 'present'; });
            // Override with actual records from BE
            attendanceRes.forEach(r => { records[r.studentId] = r.status.toLowerCase(); });
            
            setAttendance(records);
            setSaved(attendanceRes.length > 0 && !isHistory);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAll = (status) => {
        const updated = {};
        classStudents.forEach(s => { updated[s.id] = status; });
        setAttendance(updated);
        setSaved(false);
    };

    const setStatus = (id, status) => {
        setAttendance(prev => ({ ...prev, [id]: status }));
        setSaved(false);
    };

    const handleSave = async () => {
        if (classStudents.length === 0) return;
        setLoading(true);
        try {
            // Đảm bảo tất cả sinh viên trong danh sách đều có trạng thái, mặc định là 'present'
            const finalAttendance = { ...attendance };
            classStudents.forEach(s => {
                if (!finalAttendance[s.id]) {
                    finalAttendance[s.id] = 'present';
                }
            });

            await api.post('/attendance/bulk', {
                date: selectedDate,
                classId: selectedClass,
                attendanceMap: finalAttendance
            });
            setAttendance(finalAttendance);
            setSaved(true);
        } catch (error) {
            alert('Lỗi khi lưu điểm danh: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const counts = { present: 0, absent: 0, late: 0 };
    classStudents.forEach(s => counts[attendance[s.id]]++);

    return (
        <div className="space-y-5 animate-fade-in">
            {isHistory && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700">
                    <ShieldAlert size={20} />
                    <p className="text-sm font-medium">Hệ thống chỉ cho phép ghi nhận hoặc chỉnh sửa điểm danh trong <b>ngày hôm nay</b> ({todayStr}). Bạn hiện đang ở chế độ xem lịch sử.</p>
                </div>
            )}
            {/* Controls */}
            <div className="card">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Học phần / Lớp</label>
                        <select className="input bg-slate-50 border-transparent hover:border-indigo-200 transition-all" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Ngày điểm danh</label>
                        <input type="date" className="input bg-slate-50 border-transparent hover:border-indigo-200 transition-all" value={selectedDate}
                            onChange={e => { setSelectedDate(e.target.value); setSaved(false); }} />
                    </div>
                </div>
            </div>

            {/* Attendance Summary Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 animate-slide-up">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sĩ số lớp</p>
                        <p className="text-xl font-black text-gray-800">{classStudents.length} <span className="text-sm font-medium text-gray-400">sinh viên</span></p>
                    </div>
                    <div className="w-px h-10 bg-gray-100 hidden md:block"></div>
                    <div className="flex gap-2">
                        <button className="btn-secondary py-2 px-4 text-xs font-bold" onClick={() => markAll('present')} disabled={!canEdit || !hasSchedule}>
                            <Check size={14} className="text-emerald-500" /> CÓ MẶT TẤT CẢ
                        </button>
                        <button className="btn-secondary py-2 px-4 text-xs font-bold" onClick={() => markAll('absent')} disabled={!canEdit || !hasSchedule}>
                            <X size={14} className="text-red-500" /> VẮNG TẤT CẢ
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        className={`btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl shadow-lg transition-all active:scale-95 ${saved ? 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-100' : 'hover:shadow-indigo-200 shadow-indigo-100'}`}
                        onClick={handleSave}
                        disabled={!canEdit || loading || classStudents.length === 0 || !hasSchedule || (!isWithinTime && !isHistory)}
                    >
                        {saved ? <Check size={20} /> : <Save size={20} />}
                        <span className="font-bold">{saved ? 'ĐÃ LƯU DỮ LIỆU' : 'LƯU ĐIỂM DANH'}</span>
                    </button>
                </div>
            </div>

            {!hasSchedule && (
                <div className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="font-bold">Không có lịch dạy!</p>
                        <p className="text-xs opacity-80">Hôm nay ({new Date(selectedDate).toLocaleDateString('vi-VN', {weekday: 'long'})}) không được phân công lịch dạy cho lớp này. Chức năng điểm danh đã bị khóa.</p>
                    </div>
                </div>
            )}

            {hasSchedule && !isWithinTime && !isHistory && (
                <div className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-200 rounded-3xl text-blue-800 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="font-bold">Chưa đến (hoặc đã quá) giờ học!</p>
                        <p className="text-xs opacity-80">
                            Thời gian hệ thống: <span className="font-bold">{new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>. 
                            Khung giờ học: <span className="font-bold">{scheduleInfo}</span>. 
                            Hệ thống chỉ mở điểm danh trong khung giờ này (±30 phút).
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5">
                {/* Attendance list */}
                <div className="card p-0 overflow-hidden shadow-sm border border-gray-100 relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-gray-800 text-lg">
                                Danh sách điểm danh — Lớp {selectedClass}
                            </h3>
                            <div className="flex items-center gap-3 ml-4 border-l pl-4 border-gray-100">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    <span className="text-[11px] font-bold text-emerald-700">{counts.present} Có mặt</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    <span className="text-[11px] font-bold text-orange-700">{counts.late} Muộn</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    <span className="text-[11px] font-bold text-red-700">{counts.absent} Vắng</span>
                                </div>
                            </div>
                        </div>
                        {saved
                            ? <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium mr-2 animate-fade-in"><Check size={15} strokeWidth={3} /> Đã lưu thành công</span>
                                <button className="btn-secondary py-1.5 flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm"
                                    onClick={() => exportDailyAttendancePDF({
                                        className: selectedClass,
                                        date: selectedDate,
                                        students: classStudents,
                                        attendanceMap: attendance
                                    })}>
                                    <FileText size={14} /> Xuất PDF
                                </button>
                                <button className="btn-secondary py-1.5 flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                                    onClick={() => exportDailyAttendanceExcel({
                                        className: selectedClass,
                                        date: selectedDate,
                                        students: classStudents,
                                        attendanceMap: attendance
                                    })}>
                                    <FileSpreadsheet size={14} /> Xuất Excel
                                </button>
                            </div>
                            : <button className={`btn-primary py-2 px-6 shadow-lg shadow-indigo-100 ${(!canEdit || loading) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={(canEdit && !loading) ? handleSave : null} disabled={!canEdit || loading}>
                                <Save size={16} /> Lưu kết quả
                            </button>
                        }
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                                <tr className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                                    <th className="text-left px-8 py-4 w-16">STT</th>
                                    <th className="text-left px-5 py-4">Thông tin học sinh</th>
                                    <th className="text-center px-5 py-4">Trạng thái điểm danh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {classStudents.map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 text-gray-400 font-medium">{i + 1}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform">
                                                    {s.name.split(' ').pop()[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-700">{s.name}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{s.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <StatusButton status="present" current={attendance[s.id]} onClick={() => setStatus(s.id, 'present')} disabled={!canEdit} />
                                                <StatusButton status="late" current={attendance[s.id]} onClick={() => setStatus(s.id, 'late')} disabled={!canEdit} />
                                                <StatusButton status="absent" current={attendance[s.id]} onClick={() => setStatus(s.id, 'absent')} disabled={!canEdit} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && classStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-20 text-center text-gray-400">
                                            Không có học sinh nào trong lớp này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
