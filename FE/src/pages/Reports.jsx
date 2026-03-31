import { useState, useMemo } from 'react';
import { students, classes, attendanceRecords, recentDates } from '../data/mockData';
import { exportAttendancePDF, exportSemesterReportPDF } from '../utils/pdfExport';
import { FileDown, Filter, BarChart2, PieChart } from 'lucide-react';

function AttendanceBadge({ status }) {
    if (status === 'present') return <span className="badge-present">P</span>;
    if (status === 'absent') return <span className="badge-absent">V</span>;
    if (status === 'late') return <span className="badge-late">M</span>;
    return <span className="text-gray-300">—</span>;
}

export function Reports() {
    const [filterClass, setFilterClass] = useState(classes[0]);
    const [fromDate, setFromDate] = useState(recentDates[0]);
    const [toDate, setToDate] = useState(recentDates[recentDates.length - 1]);

    const filteredDates = useMemo(() =>
        recentDates.filter(d => d >= fromDate && d <= toDate),
        [fromDate, toDate]
    );

    const filteredStudents = useMemo(() =>
        students.filter(s => s.class === filterClass),
        [filterClass]
    );

    const filteredRecords = useMemo(() =>
        attendanceRecords.filter(r =>
            r.class === filterClass && r.date >= fromDate && r.date <= toDate
        ), [filterClass, fromDate, toDate]
    );

    // Tổng hợp theo học sinh
    const summary = useMemo(() =>
        filteredStudents.map(s => {
            const recs = filteredRecords.filter(r => r.studentId === s.id);
            const present = recs.filter(r => r.status === 'present').length;
            const absent = recs.filter(r => r.status === 'absent').length;
            const late = recs.filter(r => r.status === 'late').length;
            const total = filteredDates.length;
            const rate = total ? Math.round(((present + late) / total) * 100) : 0;
            return { ...s, present, absent, late, total, rate };
        }), [filteredStudents, filteredRecords, filteredDates]
    );

    const handleExportPDF = () => {
        exportAttendancePDF({
            className: filterClass,
            fromDate,
            toDate,
            students: filteredStudents,
            dates: filteredDates,
            records: filteredRecords,
        });
    };

    const handleExportSemester = () => {
        exportSemesterReportPDF({
            className: filterClass,
            students: filteredStudents,
            records: attendanceRecords.filter(r => r.class === filterClass)
        });
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Filter bar */}
            <div className="card">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                        <select className="input w-32" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                            {classes.map(c => <option key={c}>{c}</option>)}
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
                    <div className="flex gap-2 ml-auto">
                        <button className="btn-secondary flex items-center gap-2 border-indigo-200 text-indigo-600" onClick={handleExportSemester}>
                            <PieChart size={15} /> Báo cáo học kỳ (%)
                        </button>
                        <button className="btn-primary" onClick={handleExportPDF}>
                            <FileDown size={15} /> Xuất PDF phạm vi
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Học sinh', value: filteredStudents.length, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Ngày học', value: filteredDates.length, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Tỉ lệ TB', value: summary.length ? Math.round(summary.reduce((a, s) => a + s.rate, 0) / summary.length) + '%' : '—', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Vắng nhiều nhất', value: summary.length ? Math.max(...summary.map(s => s.absent)) : 0, color: 'text-red-600 bg-red-50' },
                ].map(item => (
                    <div key={item.label} className={`card flex items-center gap-4 p-4 ${item.color.split(' ')[1]}`}>
                        <p className={`text-2xl font-bold ${item.color.split(' ')[0]}`}>{item.value}</p>
                        <p className="text-sm text-gray-600">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Tổng hợp bảng */}
            <div className="card p-0 overflow-hidden">
                <div className="flex items-center gap-2 p-5 border-b border-gray-100">
                    <BarChart2 size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">Bảng tổng hợp — Lớp {filterClass}</h3>
                    <span className="ml-2 text-xs text-gray-400">
                        {fromDate} → {toDate} ({filteredDates.length} ngày)
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="text-left p-4">Học sinh</th>
                                <th className="text-center p-4">Có mặt</th>
                                <th className="text-center p-4">Vắng</th>
                                <th className="text-center p-4">Muộn</th>
                                <th className="text-center p-4">Tỷ lệ (%)</th>
                                <th className="text-left p-4 min-w-48">Biểu đồ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map(s => (
                                <tr key={s.id} className="table-row">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                {s.name.split(' ').pop()[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{s.name}</p>
                                                <p className="text-xs text-gray-400">{s.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="badge-present">{s.present}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="badge-absent">{s.absent}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="badge-late">{s.late}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${s.rate >= 80 ? 'text-emerald-600' : s.rate >= 60 ? 'text-orange-500' : 'text-red-600'}`}>
                                            {s.rate}%
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-0.5 h-4">
                                            {filteredDates.map(date => {
                                                const rec = filteredRecords.find(r => r.studentId === s.id && r.date === date);
                                                const color = !rec ? 'bg-gray-200'
                                                    : rec.status === 'present' ? 'bg-emerald-500'
                                                        : rec.status === 'absent' ? 'bg-red-500'
                                                            : 'bg-orange-400';
                                                return <div key={date} className={`flex-1 rounded-sm ${color}`} title={`${date}: ${rec?.status || '—'}`} />;
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
