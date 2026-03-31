import { useMemo } from 'react';
import { attendanceRecords, recentDates } from '../data/mockData';
import {
    Calendar, CheckCircle, XCircle, Clock,
    Award, TrendingUp, LogOut, User as UserIcon
} from 'lucide-react';

function StatItem({ label, value, color, icon: Icon }) {
    return (
        <div className="card flex items-center gap-4">
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
    const records = useMemo(() =>
        attendanceRecords.filter(r => r.studentId === student.id),
        [student.id]
    );

    const stats = useMemo(() => {
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const total = records.length || 1;
        const rate = Math.round(((present + late) / total) * 100);
        return { present, late, absent, rate };
    }, [records]);

    const todayRecord = records.find(r => r.date === '2026-03-31');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header cho học sinh */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 leading-tight">Chào mừng, {student.name}</h1>
                        <p className="text-xs text-gray-400 uppercase tracking-tighter">Học sinh lớp {student.class}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Đăng xuất</span>
                </button>
            </header>

            <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full animate-fade-in">
                {/* Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`card overflow-hidden relative group transition-all duration-300 ${todayRecord?.status === 'present' ? 'bg-emerald-50' : todayRecord?.status === 'absent' ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Trạng thái hôm nay</h4>
                        <div className="flex items-center gap-4">
                            {todayRecord?.status === 'present' ? (
                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white ring-4 ring-emerald-100">
                                    <CheckCircle size={24} />
                                </div>
                            ) : todayRecord?.status === 'absent' ? (
                                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white ring-4 ring-red-100">
                                    <XCircle size={24} />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white ring-4 ring-orange-100">
                                    <Clock size={24} />
                                </div>
                            )}
                            <div>
                                <p className="text-xl font-bold text-gray-800">
                                    {todayRecord?.status === 'present' ? 'Đã có mặt' : todayRecord?.status === 'absent' ? 'Vắng mặt' : 'Đi học muộn'}
                                </p>
                                <p className="text-xs text-gray-500">{todayRecord?.time ? `Lúc ${todayRecord.time}` : 'Chưa ghi nhận giờ'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card md:col-span-2 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Tỷ lệ chuyên cần</h4>
                                <p className="text-2xl font-black text-indigo-600">{stats.rate}%</p>
                            </div>
                            <div className="w-14 h-14 rounded-full border-4 border-indigo-100 flex items-center justify-center relative">
                                <TrendingUp size={20} className="text-indigo-400" />
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                                        className="text-indigo-500" strokeDasharray={`${Math.PI * 48 * (stats.rate / 100)} 999`} />
                                </svg>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${stats.rate}%` }} />
                        </div>
                    </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatItem label="Số ngày học" value={records.length} color="bg-blue-500" icon={Calendar} />
                    <StatItem label="Đã có mặt" value={stats.present} color="bg-emerald-500" icon={CheckCircle} />
                    <StatItem label="Vắng học" value={stats.absent} color="bg-red-500" icon={XCircle} />
                    <StatItem label="Đi học muộn" value={stats.late} color="bg-orange-500" icon={Clock} />
                </div>

                {/* History Table */}
                <div className="card p-0 overflow-hidden shadow-md">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-500" />
                            Lịch sử điểm danh chi tiết
                        </h3>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-medium">Tháng hiện tại</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="text-left py-4 px-6">Ngày</th>
                                    <th className="text-left py-4 px-6">Giờ đến</th>
                                    <th className="text-center py-4 px-6">Trạng thái</th>
                                    <th className="text-left py-4 px-6">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...records].reverse().map((r, i) => (
                                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-700">{r.date}</td>
                                        <td className="py-4 px-6 text-gray-500">{r.time || '—'}</td>
                                        <td className="py-4 px-6 text-center">
                                            {r.status === 'present' ? (
                                                <span className="badge-present">Có mặt</span>
                                            ) : r.status === 'absent' ? (
                                                <span className="badge-absent">Vắng mặt</span>
                                            ) : (
                                                <span className="badge-late">Đi muộn</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-gray-400">
                                            {r.status === 'present' ? 'Đúng giờ' : r.status === 'late' ? 'Muộn dưới 15p' : 'Nghỉ có phép'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-gray-400 text-xs">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Award size={14} className="text-indigo-300" />
                    <span>Học chăm chỉ để đạt kết quả tốt nhất!</span>
                </div>
                <p>© 2026 Attendance AI • Hệ thống hỗ trợ giáo dục</p>
            </footer>
        </div>
    );
}
