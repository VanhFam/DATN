import { useState } from 'react';
import { students, getTodayStats, getWeeklyStats, attendanceRecords, today } from '../data/mockData';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, color }) {
    return (
        <div className="card animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={22} className="text-white" />
                </div>
            </div>
        </div>
    );
}

function AttendanceBadge({ status }) {
    if (status === 'present') return <span className="badge-present">Có mặt</span>;
    if (status === 'absent') return <span className="badge-absent">Vắng</span>;
    return <span className="badge-late">Muộn</span>;
}

export function Dashboard() {
    const stats = getTodayStats();
    const weeklyStats = getWeeklyStats();
    const todayRecords = attendanceRecords
        .filter(r => r.date === today)
        .slice(0, 8);

    const maxRate = Math.max(...weeklyStats.map(d => d.rate));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Tổng học sinh" value={students.length} subtitle="trong hệ thống" icon={Users} color="bg-indigo-500" />
                <StatCard title="Có mặt hôm nay" value={stats.present} subtitle={`/${stats.total} học sinh`} icon={CheckCircle} color="bg-emerald-500" />
                <StatCard title="Vắng mặt" value={stats.absent} subtitle="cần liên hệ phụ huynh" icon={XCircle} color="bg-red-500" />
                <StatCard title="Đi muộn" value={stats.late} subtitle="hôm nay" icon={Clock} color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly chart */}
                <div className="card lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Tỷ lệ điểm danh tuần này</h3>
                            <p className="text-xs text-gray-400">Phần trăm học sinh có mặt mỗi ngày</p>
                        </div>
                        <TrendingUp size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex items-end gap-3 h-36">
                        {weeklyStats.map(({ date, rate }) => (
                            <div key={date} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs font-semibold text-gray-600">{rate}%</span>
                                <div className="w-full rounded-t-lg bg-indigo-500 transition-all hover:bg-indigo-600"
                                    style={{ height: `${(rate / maxRate) * 100}%`, minHeight: '8px' }}
                                    title={`${date}: ${rate}%`}
                                />
                                <span className="text-[10px] text-gray-400">{date.slice(8)}/{date.slice(5, 7)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tỉ lệ hôm nay */}
                <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-4">Tổng hợp hôm nay</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Có mặt', value: stats.present, total: stats.total, color: 'bg-emerald-500' },
                            { label: 'Vắng', value: stats.absent, total: stats.total, color: 'bg-red-500' },
                            { label: 'Muộn', value: stats.late, total: stats.total, color: 'bg-orange-500' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{item.label}</span>
                                    <span className="font-medium">{item.value}/{item.total}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color} transition-all`}
                                        style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-2xl font-bold text-indigo-600 text-center">
                            {stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-gray-400 text-center">Tỷ lệ đi học</p>
                    </div>
                </div>
            </div>

            {/* Recent attendance */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">Điểm danh gần đây ({today})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="table-head">
                            <tr>
                                <th className="text-left pb-3 px-3">Học sinh</th>
                                <th className="text-left pb-3 px-3">Lớp</th>
                                <th className="text-left pb-3 px-3">Giờ điểm danh</th>
                                <th className="text-left pb-3 px-3">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayRecords.map(r => (
                                <tr key={r.id} className="table-row">
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs">
                                                {r.studentName.split(' ').pop()[0]}
                                            </div>
                                            {r.studentName}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-gray-500">{r.class}</td>
                                    <td className="py-3 px-3 text-gray-500">{r.time || '—'}</td>
                                    <td className="py-3 px-3"><AttendanceBadge status={r.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
