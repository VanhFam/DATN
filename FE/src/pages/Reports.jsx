import { useState, useMemo, useEffect } from 'react';
import { api } from '../utils/api';
import { exportAttendancePDF, exportSemesterReportPDF } from '../utils/pdfExport';
import { exportSemesterReportExcel, exportAttendanceRangeExcel } from '../utils/excelExport';
import { FileDown, Filter, BarChart2, PieChart, FileSpreadsheet, Loader2, RefreshCcw } from 'lucide-react';

function AttendanceBadge({ status }) {
    if (status?.toLowerCase() === 'present') return <span className="badge-present">P</span>;
    if (status?.toLowerCase() === 'absent') return <span className="badge-absent">V</span>;
    if (status?.toLowerCase() === 'late') return <span className="badge-late">M</span>;
    return <span className="text-gray-300">—</span>;
}

export function Reports() {
    const [classes, setClasses] = useState([]);
    const [filterClass, setFilterClass] = useState('');
    const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (filterClass) {
            fetchReportData();
        }
    }, [filterClass, fromDate, toDate]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res);
            if (res.length > 0) setFilterClass(res[0].id);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        setStudents([]); // Reset state để tránh nhầm dữ liệu môn cũ
        setRecords([]);
        try {
            const [studentsRes, recordsRes] = await Promise.all([
                api.get(`/students/class/${filterClass}`),
                api.get(`/attendance/class/${filterClass}/report?from=${fromDate}&to=${toDate}`)
            ]);
            setStudents(studentsRes);
            setRecords(recordsRes);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tạo danh sách các ngày duy nhất có trong bản ghi để hiển thị cột
    const uniqueDates = useMemo(() => {
        const dates = [...new Set(records.map(r => r.date))];
        return dates.sort();
    }, [records]);

    // Tổng hợp thống kê theo học sinh
    const summary = useMemo(() => {
        return students.map(s => {
            const studentRecords = records.filter(r => r.studentId === s.id);
            const present = studentRecords.filter(r => r.status.toLowerCase() === 'present').length;
            const absent = studentRecords.filter(r => r.status.toLowerCase() === 'absent').length;
            const late = studentRecords.filter(r => r.status.toLowerCase() === 'late').length;
            
            // Tính số ngày có lịch học thực tế (dựa trên dữ liệu)
            const totalClassDays = uniqueDates.length;
            const score = (present + (late * 0.8)); // Muộn tính 0.8 điểm chuyên cần
            const rate = totalClassDays ? Math.round((score / totalClassDays) * 100) : 0;
            
            return { ...s, present, absent, late, total: totalClassDays, rate };
        });
    }, [students, records, uniqueDates]);

    const handleExportPDF = () => {
        exportAttendancePDF({
            className: filterClass,
            fromDate,
            toDate,
            students: students,
            dates: uniqueDates,
            records: records,
        });
    };

    const handleExportSemester = () => {
        exportSemesterReportPDF({
            className: filterClass,
            students: students,
            records: records // Trong thực tế nên fetch data cả kỳ
        });
    };

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                        <input type="date" className="input w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                        <input type="date" className="input w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-3 ml-auto">
                        <button className="btn-secondary h-10 px-4 flex items-center gap-2" onClick={fetchReportData}>
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                        </button>
                        <button className="btn-secondary h-10 px-4 flex items-center gap-2" onClick={handleExportPDF}>
                            <FileDown size={14} /> Xuất PDF
                        </button>
                        <button className="btn-primary h-10 px-4 flex items-center gap-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600" onClick={handleExportSemester}>
                            <FileSpreadsheet size={14} /> Báo cáo học kỳ
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card py-20 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                    <p className="font-medium">Đang tải dữ liệu báo cáo...</p>
                </div>
            ) : (
                <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Học sinh', value: students.length, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Buổi học', value: uniqueDates.length, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Tỉ lệ TB', value: summary.length ? Math.round(summary.reduce((a, s) => a + s.rate, 0) / summary.length) + '%' : '—', color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Cảnh báo Đỏ', value: summary.filter(s => s.rate < 80).length, color: 'text-red-600 bg-red-50' },
                        ].map(item => (
                            <div key={item.label} className={`card flex items-center gap-4 p-4 ${item.color.split(' ')[1]}`}>
                                <p className={`text-2xl font-bold ${item.color.split(' ')[0]}`}>{item.value}</p>
                                <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tổng hợp bảng */}
                    <div className="card p-0 overflow-hidden shadow-xl border-gray-100">
                        <div className="flex items-center gap-2 p-5 border-b border-gray-100 bg-slate-50/50">
                            <BarChart2 size={18} className="text-indigo-500" />
                            <h3 className="font-bold text-gray-800">Bảng tổng hợp chi tiết chuyên cần</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                                    <tr>
                                        <th className="text-left p-4">Học sinh</th>
                                        <th className="text-center p-4">Có mặt</th>
                                        <th className="text-center p-4">Vắng</th>
                                        <th className="text-center p-4">Muộn</th>
                                        <th className="text-center p-4">Tỉ lệ (%)</th>
                                        <th className="text-left p-4 min-w-[200px]">Diễn biến</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map(s => (
                                        <tr key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
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
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-black text-base ${s.rate >= 85 ? 'text-emerald-600' : s.rate >= 80 ? 'text-amber-500' : 'text-red-600'}`}>
                                                        {s.rate}%
                                                    </span>
                                                    {s.rate < 80 ? (
                                                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 border border-red-100">CẤM THI</span>
                                                    ) : s.rate < 85 ? (
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-100">CẢNH BÁO</span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1 h-3 scale-y-150 origin-center">
                                                    {uniqueDates.slice(-20).map(date => {
                                                        const rec = records.find(r => r.studentId === s.id && r.date === date);
                                                        const color = !rec ? 'bg-gray-100'
                                                            : rec.status.toLowerCase() === 'present' ? 'bg-emerald-500'
                                                                : rec.status.toLowerCase() === 'absent' ? 'bg-red-500'
                                                                    : 'bg-amber-400';
                                                        return <div key={date} className={`flex-1 rounded-[1px] ${color}`} title={`${date}: ${rec?.status || 'Không học'}`} />;
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
