import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Award, TrendingUp, LogOut, User as UserIcon,
    Users, Mail, Phone, Filter, Loader2, AlertTriangle
} from 'lucide-react';

function StatItem({ label, value, color, icon: Icon }) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon className="text-white" size={24} />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

export function StudentDashboard({ student, onLogout }) {
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [loading, setLoading] = useState(true);

    // Mặc định xem trong 30 ngày gần nhất
    const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [fromDate, toDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recordsRes, summaryRes, teachersRes, clsRes] = await Promise.all([
                api.get(`/attendance/student/${student.id}?from=${fromDate}&to=${toDate}`),
                api.get(`/attendance/student/${student.id}/summary?from=${fromDate}&to=${toDate}`),
                api.get('/teachers'),
                api.get('/classes')
            ]);
            setRecords(recordsRes);
            setSummary(summaryRes);
            setTeachers(teachersRes.filter(t => t.assignedClass === student.classId));
            setAllClasses(clsRes);
        } catch (error) {
            console.error('Failed to fetch student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = useMemo(() => {
        if (selectedClassId === 'all') return records;
        return records.filter(r => r.classId === selectedClassId);
    }, [records, selectedClassId]);

    const stats = useMemo(() => {
        if (!filteredRecords.length) return { present: 0, late: 0, absent: 0 };
        const present = filteredRecords.filter(r => r.status.toLowerCase() === 'present').length;
        const late = filteredRecords.filter(r => r.status.toLowerCase() === 'late').length;
        const absent = filteredRecords.filter(r => r.status.toLowerCase() === 'absent').length;
        return { present, late, absent };
    }, [filteredRecords]);

    const studentSubjects = useMemo(() => {
        const studentClassIds = student.classId ? student.classId.split(',').map(id => id.trim()) : [];
        const uniqueIds = [...new Set([...records.map(r => r.classId), ...studentClassIds])].filter(Boolean);
        return allClasses.filter(c => uniqueIds.includes(c.id));
    }, [records, allClasses, student.classId]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 leading-tight">Chào mừng, {student.name}</h1>
                        <p className="text-[10px] text-indigo-600 uppercase tracking-widest font-black">Mã số: {student.id}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all font-bold bg-slate-50 px-4 py-2 rounded-xl hover:bg-red-50 border border-gray-100"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Đăng xuất</span>
                </button>
            </header>

            <main className="flex-1 p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fade-in">
                {/* Simplified Filter */}
                <div className="card p-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Tìm hoặc chọn môn học</label>
                            <div className="relative group">
                                <input 
                                    list="student-subjects-list"
                                    placeholder="Gõ tên hoặc chọn môn học..."
                                    className="input text-sm h-11 pr-10"
                                    value={selectedClassId === 'all' ? '' : (allClasses.find(c => c.id === selectedClassId)?.name || selectedClassId)}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (!val) {
                                            setSelectedClassId('all');
                                            return;
                                        }
                                        const found = allClasses.find(c => c.name === val || c.id === val);
                                        setSelectedClassId(found ? found.id : val);
                                    }}
                                />
                                <datalist id="student-subjects-list">
                                    <option value="Tất cả môn học" />
                                    {studentSubjects.map(s => (
                                        <option key={s.id} value={s.name}>{s.id}</option>
                                    ))}
                                </datalist>
                                {selectedClassId !== 'all' && (
                                    <button 
                                        onClick={() => setSelectedClassId('all')}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                        title="Xóa lọc"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Filter size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Từ ngày</label>
                            <input type="date" className="input text-sm h-11" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Đến ngày</label>
                            <input type="date" className="input text-sm h-11" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                        <p className="font-medium tracking-wide">Đang tải dữ liệu của bạn...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatItem label="Tổng số buổi" value={filteredRecords.length} color="bg-blue-500" icon={Calendar} />
                            <StatItem label="Đúng giờ" value={stats.present} color="bg-emerald-500" icon={CheckCircle} />
                            <StatItem label="Nghỉ học" value={stats.absent} color="bg-red-500" icon={XCircle} />
                            <StatItem label="Đi muộn" value={stats.late} color="bg-orange-500" icon={Clock} />
                        </div>

                        {/* History Table */}
                        <div className="space-y-4">
                            <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest flex items-center gap-2 px-1">
                                <Calendar size={20} className="text-indigo-500" />
                                Chi tiết lịch sử điểm danh
                            </h3>
                            <div className="card p-0 overflow-hidden shadow-xl border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="text-left py-4 px-6">Ngày học</th>
                                            <th className="text-left py-4 px-6">Môn học</th>
                                            <th className="text-left py-4 px-6">Thời gian đến</th>
                                            <th className="text-center py-4 px-6">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredRecords.length > 0 ? [...filteredRecords].reverse().map((r, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-gray-700">{r.date}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">Kỳ học 2026</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-indigo-600">{allClasses.find(c => c.id === r.classId)?.name || r.classId}</p>
                                                    <p className="text-[9px] text-gray-400 font-mono">{r.classId}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-mono text-gray-500 bg-slate-100 px-2 py-1 rounded text-xs">{r.checkInTime || '—'}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {r.status.toLowerCase() === 'present' ? (
                                                        <span className="badge-present px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Có mặt</span>
                                                    ) : r.status.toLowerCase() === 'absent' ? (
                                                        <span className="badge-absent px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Vắng mặt</span>
                                                    ) : (
                                                        <span className="badge-late px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Muộn</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="py-20 text-center text-gray-400 italic">Không có dữ liệu trong khoảng thời gian này</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <footer className="py-10 text-center text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-auto">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <Award size={16} className="text-indigo-400" />
                    <span>CHĂM CHỈ HỌC TẬP • TƯƠNG LAI TƯƠI SÁNG</span>
                </div>
                <p>© 2026 Attendance AI • Hệ thống quản lý chuyên cần thông minh</p>
            </footer>
        </div>
    );
}

