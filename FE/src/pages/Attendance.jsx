import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { Check, X, Save, ShieldAlert, FileText, FileSpreadsheet, Clock, ScanFace, Lock, BarChart2, Calendar } from 'lucide-react';
import { exportDailyAttendancePDF } from '../utils/pdfExport';
import { exportDailyAttendanceExcel } from '../utils/excelExport';

const STATUS_LABEL = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn', half: 'Nửa buổi' };
const todayStr = new Date().toISOString().split('T')[0];

function StatusButton({ status, current, onClick, disabled }) {
    const styles = {
        present: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'present' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        absent:  `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'absent'  ? 'bg-red-500 border-red-500 text-white'         : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'}         ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        late:    `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'late'    ? 'bg-orange-500 border-orange-500 text-white'     : 'border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-600'}   ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        half:    `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'half'    ? 'bg-indigo-500 border-indigo-500 text-white'     : 'border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600'}   ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    };
    return (
        <button className={styles[status]} onClick={disabled ? null : onClick} disabled={disabled}>
            {STATUS_LABEL[status]}
        </button>
    );
}

export function Attendance({ user }) {
    const [viewMode, setViewMode]             = useState('daily'); // 'daily' | 'semester'
    const [classes, setClasses]               = useState([]);
    const [allClasses, setAllClasses]         = useState([]);
    const [semesters, setSemesters]           = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [semesterStats, setSemesterStats]   = useState([]);
    const [semesterLoading, setSemesterLoading] = useState(false);
    const [selectedClass, setSelectedClass]   = useState('');
    const [selectedDate, setSelectedDate]     = useState(todayStr);
    const [classStudents, setClassStudents]   = useState([]);
    const [attendance, setAttendance]         = useState({});
    const [originalAttendance, setOriginalAttendance] = useState({});
    const [attendanceMeta, setAttendanceMeta] = useState({});
    const [loading, setLoading]               = useState(false);
    const [saved, setSaved]                   = useState(false);
    const [hasSchedule, setHasSchedule]       = useState(true);
    const [isWithinTime, setIsWithinTime]     = useState(true);
    const [scheduleInfo, setScheduleInfo]     = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [classEnded, setClassEnded]         = useState(false);
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Refs để timer callback luôn đọc được giá trị mới nhất của state
    const attendanceRef    = useRef({});
    const metaRef          = useRef({});
    const studentsRef      = useRef([]);
    const selectedClassRef = useRef('');
    const selectedDateRef  = useRef('');
    const selectedScheduleRef = useRef('');
    const endTimerRef      = useRef(null);
    const autoSavedRef     = useRef(false);

    useEffect(() => { attendanceRef.current    = attendance;     }, [attendance]);
    useEffect(() => { metaRef.current          = attendanceMeta; }, [attendanceMeta]);
    useEffect(() => { studentsRef.current      = classStudents;  }, [classStudents]);
    useEffect(() => { selectedClassRef.current = selectedClass;  }, [selectedClass]);
    useEffect(() => { selectedDateRef.current  = selectedDate;   }, [selectedDate]);
    useEffect(() => { selectedScheduleRef.current = selectedScheduleId; }, [selectedScheduleId]);

    // Dọn dẹp timer khi component unmount
    useEffect(() => () => { if (endTimerRef.current) clearTimeout(endTimerRef.current); }, []);

    const pickScheduleId = (schedules, currentMinutes = null) => {
        if (!schedules?.length) return '';
        if (schedules.length === 1) return schedules[0].id;
        const minutes = currentMinutes ?? (new Date().getHours() * 60 + new Date().getMinutes());
        const active = schedules.find(s => {
            const [sh, sm] = s.startTime.split(':').map(Number);
            const [eh, em] = s.endTime.split(':').map(Number);
            return minutes >= sh * 60 + sm - 30 && minutes <= eh * 60 + em + 30;
        });
        return (active || schedules[0]).id;
    };

    const recordMatchesSchedule = (record, scheduleId) =>
        !scheduleId || !record.scheduleId || String(record.scheduleId) === String(scheduleId);

    const loadSemesterStats = async (semId) => {
        if (!semId) return;
        const sem = semesters.find(s => String(s.id) === String(semId));
        if (!sem) return;
        setSemesterLoading(true);
        setSemesterStats([]);
        try {
            // Lấy tất cả lịch dạy thuộc học kỳ này
            const [schedulesRes, studentsAllRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/students'),
            ]);
            const semSchedules = schedulesRes.filter(s => String(s.semesterId) === String(semId));
            const classIds = [...new Set(semSchedules.map(s => s.classId))];

            const stats = await Promise.all(classIds.map(async (classId) => {
                const cls = allClasses.find(c => c.id === classId);
                const classSchedules = semSchedules.filter(s => String(s.classId) === String(classId));
                const assignedSessions = classSchedules.reduce((sum, s) => sum + (Number(s.sessionsCount) || 0), 0);
                const semesterSessionTotal = isAdmin
                    ? (cls?.totalSessions || assignedSessions || classSchedules.length || null)
                    : (assignedSessions || null);

                // Lấy tất cả bản ghi điểm danh của lớp trong khoảng thời gian học kỳ
                const records = await api.get(
                    `/attendance/class/${classId}/report?from=${sem.startDate}&to=${sem.endDate}`
                ).catch(() => []);

                // Nhóm theo sinh viên
                const students = studentsAllRes.filter(sv =>
                    records.some(r => r.studentId === sv.id)
                );

                const studentStats = students.map(sv => {
                    const svRecords = records.filter(r => r.studentId === sv.id);
                    const present = svRecords.filter(r => r.status?.toLowerCase() === 'present').length;
                    const late    = svRecords.filter(r => r.status?.toLowerCase() === 'late').length;
                    const half    = svRecords.filter(r => r.status?.toLowerCase() === 'half').length;
                    const attended = present + late * 0.75 + half * 0.5;
                    const total    = semesterSessionTotal || svRecords.length;
                    const pct      = total > 0 ? Math.round((attended / total) * 100) : null;
                    return { ...sv, attended, total, pct, eligible: pct !== null ? pct >= 70 : null };
                });

                return { classId, className: cls?.name || classId, semesterSessionTotal, studentStats };
            }));

            setSemesterStats(stats);
        } catch (e) {
            console.error('Lỗi tải thống kê học kỳ:', e);
        } finally {
            setSemesterLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'semester' && selectedSemester && semesters.length > 0 && allClasses.length > 0)
            loadSemesterStats(selectedSemester);
    }, [viewMode, selectedSemester, semesters, allClasses]);

    const isHistory = selectedDate !== todayStr;
    const canEdit   = !isHistory && !classEnded;

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const [clsRes, semRes] = await Promise.all([
                    api.get('/classes'),
                    api.get('/semesters'),
                ]);
                setAllClasses(clsRes);
                setClasses(clsRes.map(c => c.id));
                if (clsRes.length > 0) setSelectedClass(clsRes[0].id);
                setSemesters(semRes || []);
                const active = (semRes || []).find(s => s.isActive);
                if (active) setSelectedSemester(String(active.id));
            } catch (err) {
                console.error('Failed to fetch classes:', err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) fetchAttendanceData();
    }, [selectedClass, selectedDate]);

    // Hàm tự động lưu dùng ref — an toàn khi gọi từ bên trong setTimeout
    const doAutoSave = async () => {
        if (autoSavedRef.current) return;
        autoSavedRef.current = true;

        const students  = studentsRef.current;
        const att       = attendanceRef.current;
        const meta      = metaRef.current;
        const classId   = selectedClassRef.current;
        const date      = selectedDateRef.current;
        const scheduleId = selectedScheduleRef.current;

        const finalMap = {};
        students.forEach(s => {
            if (!meta[s.id]?.method) {
                finalMap[s.id] = att[s.id] || 'absent';
            }
        });

        if (Object.keys(finalMap).length === 0) { setSaved(true); return; }

        try {
            await api.post('/attendance/bulk', { date, classId, scheduleId, attendanceMap: finalMap });
            setSaved(true);
        } catch (e) {
            console.error('Auto-save thất bại:', e);
        }
    };

    const fetchAttendanceData = async () => {
        // Reset timer và trạng thái khoá trước mỗi lần fetch
        if (endTimerRef.current) clearTimeout(endTimerRef.current);
        autoSavedRef.current = false;
        setClassEnded(false);

        setLoading(true);
        setClassStudents([]);
        setAttendance({});
        setOriginalAttendance({});
        setAttendanceMeta({});

        try {
            const [studentsRes, attendanceRes, schedulesRes] = await Promise.all([
                api.get(`/students/class/${selectedClass}`),
                api.get(`/attendance?classId=${selectedClass}&date=${selectedDate}`),
                api.get('/schedules')
            ]);

            const dateObj = new Date(selectedDate);
            const dayMap  = { 0: 'Chủ Nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' };
            const dayStr  = dayMap[dateObj.getDay()];

            const classSchedule = schedulesRes.filter(s => s.classId === selectedClass && s.dayOfWeek === dayStr);
            setHasSchedule(classSchedule.length > 0);
            let currentScheduleId = '';

            if (classSchedule.length > 0) {
                const now            = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                currentScheduleId = pickScheduleId(classSchedule, currentMinutes);
                setSelectedScheduleId(currentScheduleId);
                selectedScheduleRef.current = currentScheduleId;

                // Tính giờ kết thúc muộn nhất trong ngày
                const maxEndMin = Math.max(...classSchedule.map(s => {
                    const [eh, em] = s.endTime.split(':').map(Number);
                    return eh * 60 + em;
                }));

                if (!isHistory && currentMinutes > maxEndMin) {
                    // Đã hết giờ học — khoá ngay và tự động lưu với dữ liệu vừa fetch
                    setClassEnded(true);
                    autoSavedRef.current = true; // chặn doAutoSave gọi lại

                    const recordsForSchedule = attendanceRes.filter(r => recordMatchesSchedule(r, currentScheduleId));
                    const finalMap = {};
                    studentsRes.forEach(s => {
                        const existing = recordsForSchedule.find(r => r.studentId === s.id);
                        if (!existing) {
                            finalMap[s.id] = 'absent';
                        }
                    });

                    if (Object.keys(finalMap).length > 0) {
                        await api.post('/attendance/bulk', {
                            date: selectedDate,
                            classId: selectedClass,
                            scheduleId: currentScheduleId,
                            attendanceMap: finalMap
                        }).catch(e => console.error('Auto-save thất bại:', e));
                    }
                } else if (!isHistory) {
                    // Đặt timer tự lưu đúng lúc hết giờ
                    const msUntilEnd = (maxEndMin - currentMinutes) * 60_000 - now.getSeconds() * 1000;
                    if (msUntilEnd > 0) {
                        endTimerRef.current = setTimeout(async () => {
                            setClassEnded(true);
                            await doAutoSave();
                        }, msUntilEnd);
                    }
                }

                const within = classSchedule.some(s => {
                    const [sh, sm] = s.startTime.split(':').map(Number);
                    return currentMinutes >= sh * 60 + sm - 15;
                });
                setIsWithinTime(within || isHistory);
                setScheduleInfo(classSchedule.map(s => `${s.startTime} - ${s.endTime}`).join(', '));
            } else {
                setIsWithinTime(false);
                setScheduleInfo('');
                setSelectedScheduleId('');
                selectedScheduleRef.current = '';
            }

            setClassStudents(studentsRes);

            const recordsForSchedule = currentScheduleId
                ? attendanceRes.filter(r => recordMatchesSchedule(r, currentScheduleId))
                : attendanceRes;

            const records = {};
            const meta    = {};
            studentsRes.forEach(s => { records[s.id] = 'absent'; });
            recordsForSchedule.forEach(r => {
                records[r.studentId] = r.status.toLowerCase();
                meta[r.studentId]    = {
                    method:      r.method?.toLowerCase(),
                    checkInTime: r.checkInTime,
                    note:        r.note,
                    scheduleId:  r.scheduleId
                };
            });

            setAttendance(records);
            setOriginalAttendance(records);
            setAttendanceMeta(meta);

            const allSaved = studentsRes.length > 0 &&
                studentsRes.every(s => recordsForSchedule.some(r => r.studentId === s.id));
            setSaved(allSaved && !isHistory);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAll = (status) => {
        const updated = { ...attendance };
        classStudents.forEach(s => {
            if (attendanceMeta[s.id]?.method !== 'face_id') updated[s.id] = status;
        });
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
            const finalAttendance = {};
            classStudents.forEach(s => {
                const currentStatus = attendance[s.id] || 'absent';
                const originalStatus = originalAttendance[s.id] || 'absent';
                if (attendanceMeta[s.id]?.method !== 'face_id' && currentStatus !== originalStatus) {
                    finalAttendance[s.id] = currentStatus;
                }
            });

            if (Object.keys(finalAttendance).length > 0) {
                await api.post('/attendance/bulk', {
                    date: selectedDate,
                    classId: selectedClass,
                    scheduleId: selectedScheduleId,
                    attendanceMap: finalAttendance
                });
            }
            setSaved(true);
            setOriginalAttendance(attendance);
        } catch (error) {
            alert('Lỗi khi lưu điểm danh: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const counts = { present: 0, absent: 0, late: 0, half: 0 };
    classStudents.forEach(s => counts[attendance[s.id]]++);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* View mode toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                <button
                    onClick={() => setViewMode('daily')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'daily' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock size={15} /> Điểm danh theo ngày
                </button>
                <button
                    onClick={() => setViewMode('semester')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'semester' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BarChart2 size={15} /> Tổng hợp theo học kỳ
                </button>
            </div>

            {/* ===== CHẾ ĐỘ TỔNG HỢP HỌC KỲ ===== */}
            {viewMode === 'semester' && (
                <div className="space-y-5">
                    <div className="card">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Chọn học kỳ</label>
                                <select className="input" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                                    <option value="">-- Chọn học kỳ --</option>
                                    {semesters.map(s => (
                                        <option key={s.id} value={String(s.id)}>{s.name}{s.isActive ? ' (đang hoạt động)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-400">
                                Ngưỡng đủ điều kiện thi: <b className="text-indigo-600">≥ 70%</b>
                            </p>
                        </div>
                    </div>

                    {semesterLoading && (
                        <div className="flex items-center justify-center py-20 text-gray-400">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
                            Đang tải thống kê...
                        </div>
                    )}

                    {!semesterLoading && semesterStats.map(cls => (
                        <div key={cls.classId} className="card p-0 overflow-hidden shadow-sm border border-gray-100">
                            <div className="p-5 border-b border-gray-50 bg-white flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">{cls.className} <span className="text-gray-400 font-mono text-sm">({cls.classId})</span></h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {isAdmin ? 'Tổng số buổi học' : 'Số buổi được phân công'}: <b className="text-indigo-600">{cls.semesterSessionTotal ?? <span className="text-orange-500">Chưa thiết lập</span>}</b>
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                    {cls.studentStats.filter(s => s.eligible === true).length} / {cls.studentStats.length} sv đủ điều kiện thi
                                </div>
                            </div>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <tr>
                                            <th className="px-5 py-3 text-left">Sinh viên</th>
                                            <th className="px-5 py-3 text-center">Số buổi tham dự</th>
                                            <th className="px-5 py-3 text-center">{isAdmin ? 'Tổng buổi' : 'Buổi phân công'}</th>
                                            <th className="px-5 py-3 text-center">Chuyên cần</th>
                                            <th className="px-5 py-3 text-center">Điều kiện thi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {cls.studentStats.length === 0 ? (
                                            <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Chưa có dữ liệu điểm danh</td></tr>
                                        ) : cls.studentStats.map(sv => (
                                            <tr key={sv.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <p className="font-bold text-gray-700">{sv.name}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono">{sv.id}</p>
                                                </td>
                                                <td className="px-5 py-3 text-center font-bold text-gray-700">{sv.attended}</td>
                                                <td className="px-5 py-3 text-center text-gray-500">{sv.total}</td>
                                                <td className="px-5 py-3 text-center">
                                                    {sv.pct !== null ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${sv.pct >= 70 ? 'bg-emerald-500' : sv.pct >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                                                                    style={{ width: `${Math.min(sv.pct, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold ${sv.pct >= 70 ? 'text-emerald-600' : sv.pct >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                                                                {sv.pct}%
                                                            </span>
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {sv.eligible === true  && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">ĐỦ ĐIỀU KIỆN</span>}
                                                    {sv.eligible === false && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-600 border border-red-100">KHÔNG ĐỦ</span>}
                                                    {sv.eligible === null  && <span className="text-gray-300 text-[10px]">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {!semesterLoading && semesterStats.length === 0 && selectedSemester && (
                        <div className="card text-center py-16 text-gray-400 border-dashed border-2 bg-transparent">
                            <Calendar size={40} className="mx-auto mb-3 opacity-10" />
                            <p className="font-medium">Chưa có lịch dạy nào gắn với học kỳ này.</p>
                            <p className="text-xs mt-1">Vào trang Lịch dạy → chọn học kỳ khi tạo lịch.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ===== CHẾ ĐỘ ĐIỂM DANH THEO NGÀY ===== */}
            {viewMode === 'daily' && <>

            {isHistory && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700">
                    <ShieldAlert size={20} />
                    <p className="text-sm font-medium">Hệ thống chỉ cho phép ghi nhận hoặc chỉnh sửa điểm danh trong <b>ngày hôm nay</b> ({todayStr}). Bạn hiện đang ở chế độ xem lịch sử.</p>
                </div>
            )}

            {/* Banner khoá khi hết giờ học */}
            {classEnded && !isHistory && (
                <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-300 rounded-3xl text-gray-700 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <Lock size={20} className="text-gray-500" />
                    </div>
                    <div>
                        <p className="font-bold">Đã kết thúc giờ học — Điểm danh bị khoá</p>
                        <p className="text-xs opacity-70 mt-0.5">Kết quả điểm danh đã được tự động lưu. Học sinh chưa điểm danh được ghi nhận là <b>Vắng</b>. Không thể chỉnh sửa sau khi hết giờ.</p>
                    </div>
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
                    {classEnded && !isHistory
                        ? <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 text-gray-500 text-sm font-bold">
                            <Lock size={16} /> ĐÃ KHOÁ
                          </div>
                        : <button
                            className={`btn-primary flex items-center gap-2 px-8 py-3 rounded-2xl shadow-lg transition-all active:scale-95 ${saved ? 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-100' : 'hover:shadow-indigo-200 shadow-indigo-100'}`}
                            onClick={handleSave}
                            disabled={!canEdit || loading || classStudents.length === 0 || !hasSchedule || (!isWithinTime && !isHistory)}
                          >
                            {saved ? <Check size={20} /> : <Save size={20} />}
                            <span className="font-bold">{saved ? 'ĐÃ LƯU DỮ LIỆU' : 'LƯU ĐIỂM DANH'}</span>
                          </button>
                    }
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

            {hasSchedule && !isWithinTime && !isHistory && !classEnded && (
                <div className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-200 rounded-3xl text-blue-800 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="font-bold">Chưa đến giờ học!</p>
                        <p className="text-xs opacity-80">
                            Thời gian hệ thống: <span className="font-bold">{new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</span>.
                            Khung giờ học: <span className="font-bold">{scheduleInfo}</span>.
                            <br/>
                            <span className="text-[10px] font-bold opacity-70 italic">* Lớp hiện sớm 15p trước giờ. Sau 15p tính Muộn, sau 30p tính Nửa buổi.</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5">
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
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    <span className="text-[11px] font-bold text-indigo-700">{counts.half} Nửa buổi</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    <span className="text-[11px] font-bold text-red-700">{counts.absent} Vắng</span>
                                </div>
                            </div>
                        </div>

                        {/* Nút xuất file — hiện khi đã lưu */}
                        {saved && (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium mr-2 animate-fade-in">
                                    <Check size={15} strokeWidth={3} /> Đã lưu thành công
                                </span>
                                <button className="btn-secondary py-1.5 flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm"
                                    onClick={() => exportDailyAttendancePDF({ className: selectedClass, date: selectedDate, students: classStudents, attendanceMap: attendance })}>
                                    <FileText size={14} /> Xuất PDF
                                </button>
                                <button className="btn-secondary py-1.5 flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                                    onClick={() => exportDailyAttendanceExcel({ className: selectedClass, date: selectedDate, students: classStudents, attendanceMap: attendance })}>
                                    <FileSpreadsheet size={14} /> Xuất Excel
                                </button>
                            </div>
                        )}
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
                                            <div className="flex flex-col items-center gap-2">
                                                {attendanceMeta[s.id]?.method === 'face_id' ? (
                                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold">
                                                            <ScanFace size={12} />
                                                            Nhận diện khuôn mặt
                                                        </span>
                                                        {attendanceMeta[s.id]?.checkInTime && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                                                                <Clock size={10} />
                                                                {attendanceMeta[s.id].checkInTime.substring(0, 5)}
                                                            </span>
                                                        )}
                                                        {attendanceMeta[s.id]?.note && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                                                                {attendanceMeta[s.id].note}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : attendanceMeta[s.id]?.method != null && (
                                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 text-[11px] font-semibold">
                                                            Điểm danh thủ công
                                                        </span>
                                                        {attendanceMeta[s.id]?.checkInTime && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                                                                <Clock size={10} />
                                                                {attendanceMeta[s.id].checkInTime.substring(0, 5)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-center gap-3">
                                                    <StatusButton status="present" current={attendance[s.id]} onClick={() => setStatus(s.id, 'present')} disabled={!canEdit} />
                                                    <StatusButton status="late"    current={attendance[s.id]} onClick={() => setStatus(s.id, 'late')}    disabled={!canEdit} />
                                                    <StatusButton status="half"    current={attendance[s.id]} onClick={() => setStatus(s.id, 'half')}    disabled={!canEdit} />
                                                    <StatusButton status="absent"  current={attendance[s.id]} onClick={() => setStatus(s.id, 'absent')}  disabled={!canEdit} />
                                                </div>
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
            </>}
        </div>
    );
}
