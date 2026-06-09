import { useState, useMemo, useEffect } from 'react';
import { api } from '../utils/api';
import { exportSemesterReportPDF } from '../utils/pdfExport';
import { exportSemesterReportExcel } from '../utils/excelExport';
import { FileDown, BarChart2, FileSpreadsheet, Loader2, RefreshCcw, Users } from 'lucide-react';

function AttendanceBadge({ status }) {
    if (status?.toLowerCase() === 'present') return <span className="badge-present">P</span>;
    if (status?.toLowerCase() === 'absent') return <span className="badge-absent">V</span>;
    if (status?.toLowerCase() === 'late') return <span className="badge-late">M</span>;
    if (status?.toLowerCase() === 'half') return <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">1/2</span>;
    return <span className="text-gray-300">—</span>;
}

export function Reports({ user }) {
    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    const currentTeacherId = user?.id || user?.username;
    const [classes, setClasses] = useState([]);
    const [filterClass, setFilterClass] = useState('');
    const [semesters, setSemesters] = useState([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState([]);
    const [classSchedules, setClassSchedules] = useState([]);
    const [activeView, setActiveView] = useState('combined'); // 'combined' | teacherId
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (filterClass) {
            fetchReportData();
            fetchClassSchedules();
            setActiveView(isTeacher ? currentTeacherId : 'combined');
        }
    }, [filterClass, fromDate, toDate, selectedSemesterId, isTeacher, currentTeacherId]);

    const fetchInitialData = async () => {
        try {
            const [classRes, semRes] = await Promise.all([
                api.get('/classes'),
                api.get('/semesters'),
            ]);
            setClasses(classRes);
            if (classRes.length > 0) setFilterClass(classRes[0].id);
            setSemesters(semRes);
            const active = semRes.find(s => s.isActive);
            if (active) {
                setSelectedSemesterId(String(active.id));
                setFromDate(active.startDate);
                setToDate(active.endDate);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };

    const handleSemesterChange = (semId) => {
        setSelectedSemesterId(semId);
        if (semId) {
            const sem = semesters.find(s => String(s.id) === semId);
            if (sem) {
                setFromDate(sem.startDate);
                setToDate(sem.endDate);
            }
        }
    };

    const fetchClassSchedules = async () => {
        if (!filterClass) return;
        try {
            const data = await api.get(isTeacher ? '/schedules' : `/schedules/class/${filterClass}`);
            const filteredSchedules = selectedSemesterId
                ? (data || []).filter(s => s.classId === filterClass && String(s.semesterId) === selectedSemesterId)
                : (data || []).filter(s => s.classId === filterClass);
            setClassSchedules(filteredSchedules);
        } catch {
            setClassSchedules([]);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        setStudents([]);
        setRecords([]);
        try {
            const [studentsRes, recordsRes] = await Promise.all([
                api.get(`/students/class/${filterClass}`),
                api.get(`/attendance/class/${filterClass}/${isTeacher ? 'report' : 'combined-report'}?from=${fromDate}&to=${toDate}`)
            ]);
            setStudents(studentsRes);
            setRecords(recordsRes);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Distinct teachers for this class (via their schedules)
    const teacherGroups = useMemo(() => {
        const seen = new Set();
        return classSchedules.filter(s => {
            if (seen.has(s.teacherId)) return false;
            seen.add(s.teacherId);
            return true;
        });
    }, [classSchedules]);

    const isMultiTeacher = !isTeacher && teacherGroups.length > 1;

    // All unique dates (combined)
    const uniqueDates = useMemo(() => {
        const dates = [...new Set(records.map(r => r.date))];
        return dates.sort();
    }, [records]);

    // Records for the active view
    const activeRecords = useMemo(() => {
        if (isTeacher) return records;
        if (activeView === 'combined') return records;
        const teacherScheduleIds = classSchedules
            .filter(s => s.teacherId === activeView)
            .map(s => s.id);
        return records.filter(r => teacherScheduleIds.includes(r.scheduleId));
    }, [isTeacher, activeView, records, classSchedules]);

    // Unique dates for active view
    const activeUniqueDates = useMemo(() => {
        const dates = [...new Set(activeRecords.map(r => r.date))];
        return dates.sort();
    }, [activeRecords]);

    const selectedClass = useMemo(() => classes.find(c => c.id === filterClass), [classes, filterClass]);
    const selectedSemester = useMemo(() => semesters.find(s => String(s.id) === selectedSemesterId), [semesters, selectedSemesterId]);

    // Sessions count denominator for active view
    const activeTotalSessions = useMemo(() => {
        if (isTeacher) {
            const teacherSessionsCount = classSchedules.reduce((sum, s) => sum + (s.sessionsCount || 0), 0);
            return teacherSessionsCount || activeUniqueDates.length;
        }
        if (activeView === 'combined') {
            return (selectedSemesterId && selectedClass?.totalSessions)
                ? selectedClass.totalSessions
                : uniqueDates.length;
        }
        // Individual teacher view: use sessionsCount from their schedule(s)
        const teacherSessionsCount = classSchedules
            .filter(s => s.teacherId === activeView)
            .reduce((sum, s) => sum + (s.sessionsCount || 0), 0);
        return teacherSessionsCount || activeUniqueDates.length;
    }, [isTeacher, activeView, selectedSemesterId, selectedClass, uniqueDates, classSchedules, activeUniqueDates]);

    // Summary for active view
    const summary = useMemo(() => {
        return students.map(s => {
            const studentRecords = activeRecords.filter(r => r.studentId === s.id);
            const present = studentRecords.filter(r => r.status.toLowerCase() === 'present').length;
            const absent = studentRecords.filter(r => r.status.toLowerCase() === 'absent').length;
            const late = studentRecords.filter(r => r.status.toLowerCase() === 'late').length;
            const half = studentRecords.filter(r => r.status.toLowerCase() === 'half').length;
            const score = present + (late * 0.75) + (half * 0.5);
            const rate = activeTotalSessions ? Math.round((score / activeTotalSessions) * 100) : 0;
            return { ...s, present, absent, late, half, total: activeTotalSessions, rate };
        });
    }, [students, activeRecords, activeTotalSessions]);

    // Combined rate per student (always from all records / totalSessions) — used for eligibility in individual view
    const combinedRateMap = useMemo(() => {
        if (activeView === 'combined') return null;
        const totalForRate = (selectedSemesterId && selectedClass?.totalSessions)
            ? selectedClass.totalSessions
            : uniqueDates.length;
        const map = {};
        students.forEach(s => {
            const sr = records.filter(r => r.studentId === s.id);
            const score = sr.filter(r => r.status.toLowerCase() === 'present').length
                + sr.filter(r => r.status.toLowerCase() === 'late').length * 0.75
                + sr.filter(r => r.status.toLowerCase() === 'half').length * 0.5;
            map[s.id] = totalForRate ? Math.round((score / totalForRate) * 100) : 0;
        });
        return map;
    }, [activeView, students, records, uniqueDates, selectedClass, selectedSemesterId]);

    const handleExportPDF = () => {
        exportSemesterReportPDF({
            className: filterClass,
            semesterName: selectedSemester?.name || '',
            totalSessions: activeTotalSessions,
            students,
            records: activeRecords,
            summary,
        });
    };

    const handleExportExcel = () => {
        exportSemesterReportExcel({
            className: filterClass,
            semesterName: selectedSemester?.name || '',
            totalSessions: activeTotalSessions,
            students,
            records: activeRecords,
            summary,
        });
    };

    const activeTeacher = activeView !== 'combined'
        ? teacherGroups.find(t => t.teacherId === activeView)
        : null;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Filter bar */}
            <div className="card">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Học phần</label>
                        <select className="input w-48" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
                        <select className="input w-44" value={selectedSemesterId} onChange={e => handleSemesterChange(e.target.value)}>
                            <option value="">-- Tùy chọn ngày --</option>
                            {semesters.map(s => (
                                <option key={s.id} value={String(s.id)}>
                                    {s.isActive ? '✓ ' : ''}{s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input type="date" className="input w-40" value={fromDate}
                            onChange={e => { setFromDate(e.target.value); setSelectedSemesterId(''); }} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                        <input type="date" className="input w-40" value={toDate}
                            onChange={e => { setToDate(e.target.value); setSelectedSemesterId(''); }} />
                    </div>
                    <div className="flex flex-wrap gap-3 ml-auto">
                        <button className="btn-secondary h-10 px-4 flex items-center gap-2" onClick={fetchReportData}>
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                        </button>
                        <button className="btn-secondary h-10 px-4 flex items-center gap-2" onClick={handleExportPDF}>
                            <FileDown size={14} /> Báo cáo PDF
                        </button>
                        <button className="btn-primary h-10 px-4 flex items-center gap-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600" onClick={handleExportExcel}>
                            <FileSpreadsheet size={14} /> Báo cáo Excel
                        </button>
                    </div>
                </div>

                {/* Semester info strip */}
                {selectedSemester && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-sm text-indigo-700">
                        <span className="font-semibold">Học kỳ:</span>
                        <span>{selectedSemester.name}</span>
                        <span className="text-gray-400">|</span>
                        <span>{selectedSemester.startDate} → {selectedSemester.endDate}</span>
                        {selectedClass?.totalSessions && (
                            <>
                                <span className="text-gray-400">|</span>
                                <span>Tổng số buổi: <strong>{selectedClass.totalSessions}</strong></span>
                            </>
                        )}
                        {!selectedClass?.totalSessions && (
                            <>
                                <span className="text-gray-400">|</span>
                                <span className="text-amber-600 text-xs">Chưa cài tổng số buổi — tính theo buổi thực tế</span>
                            </>
                        )}
                    </div>
                )}

                {/* Multi-teacher view tabs */}
                {isMultiTeacher && !loading && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Users size={14} className="text-indigo-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Xem theo giáo viên:</span>
                            <button
                                onClick={() => setActiveView('combined')}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${activeView === 'combined' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                            >
                                Tổng hợp chung
                            </button>
                            {teacherGroups.map(t => {
                                const sc = classSchedules.find(s => s.teacherId === t.teacherId);
                                const sessions = classSchedules
                                    .filter(s => s.teacherId === t.teacherId)
                                    .reduce((sum, s) => sum + (s.sessionsCount || 0), 0);
                                return (
                                    <button
                                        key={t.teacherId}
                                        onClick={() => setActiveView(t.teacherId)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${activeView === t.teacherId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                    >
                                        {t.teacherName || t.teacherId}
                                        {sessions > 0 && <span className="ml-1 opacity-70">({sessions} buổi)</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {activeView !== 'combined' && (
                            <p className="mt-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                                Đang xem riêng: <strong>{activeTeacher?.teacherName}</strong>
                                {activeTotalSessions > 0 && ` — ${activeTotalSessions} buổi phụ trách`}
                                <span className="ml-2 text-gray-400">|</span>
                                <span className="ml-2 text-gray-500">Tỉ lệ chung hiển thị ở cột "Chung"</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="card py-20 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                    <p className="font-medium">Đang tải dữ liệu báo cáo...</p>
                </div>
            ) : (
                <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Học sinh', value: students.length, color: 'text-indigo-600 bg-indigo-50' },
                            { label: activeView === 'combined' ? 'Tổng buổi' : 'Buổi phụ trách', value: activeTotalSessions || '—', color: 'text-blue-600 bg-blue-50' },
                            { label: 'Tỉ lệ TB', value: summary.length ? Math.round(summary.reduce((a, s) => a + s.rate, 0) / summary.length) + '%' : '—', color: 'text-emerald-600 bg-emerald-50' },
                            {
                                label: 'Chuyên cần (100%)',
                                value: combinedRateMap
                                    ? Object.values(combinedRateMap).filter(r => r >= 100).length
                                    : summary.filter(s => s.rate >= 100).length,
                                color: 'text-teal-600 bg-teal-50'
                            },
                            {
                                label: 'Cấm thi (chung)',
                                value: combinedRateMap
                                    ? Object.values(combinedRateMap).filter(r => r < 70).length
                                    : summary.filter(s => s.rate < 70).length,
                                color: 'text-red-600 bg-red-50'
                            },
                        ].map(item => (
                            <div key={item.label} className={`card flex items-center gap-4 p-4 ${item.color.split(' ')[1]}`}>
                                <p className={`text-2xl font-bold ${item.color.split(' ')[0]}`}>{item.value}</p>
                                <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Detail table */}
                    <div className="card p-0 overflow-hidden shadow-xl border-gray-100">
                        <div className="flex items-center gap-2 p-5 border-b border-gray-100 bg-slate-50/50">
                            <BarChart2 size={18} className="text-indigo-500" />
                            <h3 className="font-bold text-gray-800">
                                {activeView === 'combined'
                                    ? 'Bảng tổng hợp chi tiết chuyên cần'
                                    : `Điểm danh theo GV: ${activeTeacher?.teacherName}`}
                            </h3>
                            {selectedSemester && (
                                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                    {selectedSemester.name}
                                </span>
                            )}
                            {activeView !== 'combined' && (
                                <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                    Riêng — {activeTotalSessions} buổi
                                </span>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                                    <tr>
                                        <th className="text-left p-4">Học sinh</th>
                                        <th className="text-center p-4">Có mặt</th>
                                        <th className="text-center p-4">Vắng</th>
                                        <th className="text-center p-4">Muộn</th>
                                        <th className="text-center p-4">Nửa buổi</th>
                                        <th className="text-center p-4">
                                            {activeView === 'combined' ? 'Tỉ lệ (%)' : 'Tỉ lệ riêng'}
                                        </th>
                                        {activeView !== 'combined' && combinedRateMap && (
                                            <th className="text-center p-4">Tỉ lệ chung</th>
                                        )}
                                        <th className="text-left p-4 min-w-[200px]">Diễn biến</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map(s => {
                                        const combinedRate = combinedRateMap ? combinedRateMap[s.id] : s.rate;
                                        const isPerfect = combinedRate == 100;
                                        const isEligible = combinedRate >= 80 && combinedRate < 100;
                                        const isWarning = combinedRate >= 70 && combinedRate < 80;
                                        const isBanned = combinedRate < 70;

                                        const rateColor = (r) => r >= 100 ? 'text-teal-600' : r >= 80 ? 'text-emerald-600' : r >= 70 ? 'text-amber-500' : 'text-red-600';

                                        return (
                                            <tr key={s.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${isPerfect ? 'bg-teal-50/30' : ''}`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPerfect ? 'bg-teal-100 text-teal-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            {s.name.split(' ').pop()[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{s.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{s.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-emerald-600">{s.present}</td>
                                                <td className="p-4 text-center font-bold text-red-500">{s.absent}</td>
                                                <td className="p-4 text-center font-bold text-amber-500">{s.late}</td>
                                                <td className="p-4 text-center font-bold text-indigo-500">{s.half}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-black text-base ${rateColor(s.rate)}`}>
                                                            {s.rate}%
                                                        </span>
                                                        {activeView === 'combined' && (
                                                            <>
                                                                {isPerfect && <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full mt-1 border border-teal-100">CHUYÊN CẦN</span>}
                                                                {isEligible && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">ĐẠT</span>}
                                                                {isBanned && <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 border border-red-100">CẤM THI</span>}
                                                                {isWarning && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-100">CẢNH BÁO</span>}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                {activeView !== 'combined' && combinedRateMap && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`font-black text-base ${rateColor(combinedRate)}`}>
                                                                {combinedRate}%
                                                            </span>
                                                            {isPerfect && <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full mt-1 border border-teal-100">CHUYÊN CẦN</span>}
                                                            {isEligible && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">ĐẠT</span>}
                                                            {isBanned && <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 border border-red-100">CẤM THI</span>}
                                                            {isWarning && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-100">CẢNH BÁO</span>}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <div className="flex gap-1 h-3 scale-y-150 origin-center">
                                                        {activeUniqueDates.slice(-20).map(date => {
                                                            const rec = activeRecords.find(r => r.studentId === s.id && r.date === date);
                                                            const color = !rec ? 'bg-gray-100'
                                                                : rec.status.toLowerCase() === 'present' ? 'bg-emerald-500'
                                                                    : rec.status.toLowerCase() === 'absent' ? 'bg-red-500'
                                                                        : rec.status.toLowerCase() === 'late' ? 'bg-amber-400'
                                                                            : 'bg-indigo-500';
                                                            return <div key={date} className={`flex-1 rounded-[1px] ${color}`} title={`${date}: ${rec?.status || 'Không học'}`} />;
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {students.length === 0 && (
                                <div className="text-center py-10 text-gray-400 font-medium italic">Không có dữ liệu học sinh.</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
