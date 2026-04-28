import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Calendar, BookOpen, Clock3, MapPin, ArrowRight } from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, color, loading }) {
    return (
        <div className="card animate-fade-in group hover:shadow-lg transition-all border border-gray-100 min-h-[110px] relative overflow-hidden">
            {loading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black text-gray-800 mt-2">{value}</h3>
                    {subtitle && <p className="text-[10px] text-gray-400 mt-1 font-medium">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${color}`}>
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

export function Dashboard({ user }) {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await api.get('/dashboard/stats');
                setStatsData(data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const isTeacher = user?.role?.toLowerCase() === 'teacher';
    
    // Fallback values if data is loading or missing
    const stats = statsData || {
        totalStudents: 0,
        totalClasses: 0,
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
        todayTotal: 0,
        weeklyStats: [],
        recentActivities: []
    };

    const VN_DAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const todayVN = VN_DAYS[new Date().getDay()];

    const maxRate = stats.weeklyStats.length ? Math.max(...stats.weeklyStats.map(d => d.rate)) : 100;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tổng học sinh" value={stats.totalStudents} subtitle="Đã được định danh" icon={Users} color="bg-indigo-600 shadow-indigo-100" loading={loading} />
                <StatCard title="Tổng số lớp" value={stats.totalClasses} subtitle="Đang trong học kỳ" icon={BookOpen} color="bg-blue-500 shadow-blue-100" loading={loading} />
                <StatCard title="Có mặt hôm nay" value={stats.todayPresent} subtitle={`Mục tiêu: ${stats.totalStudents}`} icon={CheckCircle} color="bg-emerald-500 shadow-emerald-100" loading={loading} />
                <StatCard title="Vắng & Muộn" value={stats.todayAbsent + stats.todayLate} subtitle="Cần lưu ý ngay" icon={Clock} color="bg-red-500 shadow-red-100" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly chart */}
                <div className="card lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-800">Tỷ lệ điểm danh 7 ngày qua</h3>
                            <p className="text-xs text-gray-400">Phần trăm học sinh có mặt hệ thống</p>
                        </div>
                        <TrendingUp size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex items-end gap-3 h-36">
                        {stats.weeklyStats.map(({ date, label, rate }) => (
                            <div key={date} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-500">{rate > 0 ? `${rate}%` : ''}</span>
                                <div className="w-full rounded-t-lg bg-indigo-500 transition-all hover:bg-indigo-600"
                                    style={{ height: `${(rate / (maxRate || 1)) * 100}%`, minHeight: '4px' }}
                                    title={`${date}: ${rate}%`}
                                />
                                <span className="text-[10px] text-gray-400">{label}</span>
                            </div>
                        ))}
                        {stats.weeklyStats.length === 0 && Array(7).fill(0).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full h-2 rounded-t-lg bg-gray-100" />
                                <span className="text-[10px] text-gray-400">—</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tỉ lệ hôm nay */}
                <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-4">Chi tiết hôm nay</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Có mặt', value: stats.todayPresent, total: stats.todayTotal, color: 'bg-emerald-500' },
                            { label: 'Vắng', value: stats.todayAbsent, total: stats.todayTotal, color: 'bg-red-500' },
                            { label: 'Muộn', value: stats.todayLate, total: stats.todayTotal, color: 'bg-orange-500' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-gray-500 uppercase">{item.label}</span>
                                    <span className={item.value > 0 ? "text-gray-800" : "text-gray-300"}>{item.value} / {item.total || 0}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                                        style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-3xl font-black text-indigo-600 text-center">
                            {stats.todayTotal ? Math.round(((stats.todayPresent + stats.todayLate) / stats.todayTotal) * 100) : 0}%
                        </p>
                        <p className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest mt-1">Tỉ lệ đi học hôm nay</p>
                    </div>
                </div>
            </div>

            {/* Recent attendance */}
            <div className="card shadow-xl border-gray-100 p-0 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-500" />
                        <h3 className="font-bold text-gray-800">Hoạt động điểm danh mới nhất</h3>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">LIVE</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6">Học sinh</th>
                                <th className="text-left py-4 px-6">Lớp</th>
                                <th className="text-left py-4 px-6">Thời gian</th>
                                <th className="text-left py-4 px-6">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recentActivities.map(r => (
                                <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {r.studentName.split(' ').pop()[0]}
                                            </div>
                                            <span className="font-bold text-gray-700">{r.studentName}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 font-medium">{r.classId}</td>
                                    <td className="py-4 px-6 text-gray-400 text-xs font-bold">{r.time}</td>
                                    <td className="py-4 px-6"><AttendanceBadge status={r.status.toLowerCase()} /></td>
                                </tr>
                            ))}
                            {stats.recentActivities.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-gray-400 italic">Chưa có hoạt động nào hôm nay.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
