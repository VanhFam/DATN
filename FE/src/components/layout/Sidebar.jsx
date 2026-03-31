import {
    LayoutDashboard, Users, ClipboardCheck,
    BarChart3, Settings, GraduationCap, LogOut
} from 'lucide-react';

const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'attendance', label: 'Điểm danh', icon: ClipboardCheck },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, onLogout, user }) {
    return (
        <div className="w-64 min-h-screen flex flex-col bg-gradient-to-b from-indigo-700 to-indigo-900 shadow-xl">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-tight">Attendance AI</h1>
                    <p className="text-indigo-300 text-xs">Quản lý điểm danh</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className={`sidebar-item w-full text-left ${currentPage === id ? 'active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>

            {/* User profile & Logout */}
            <div className="px-3 py-4 border-t border-white/10">
                <div
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 group cursor-pointer transition-all"
                >
                    <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:bg-red-500 transition-colors">
                        GV
                    </div>
                    <div className="flex-1">
                        <p className="text-white text-sm font-medium group-hover:text-red-100">{user?.name || 'Người dùng'}</p>
                        <p className="text-indigo-300 text-xs capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</p>
                    </div>
                    <LogOut size={15} className="text-indigo-300 group-hover:text-white" />
                </div>
            </div>
        </div>
    );
}
