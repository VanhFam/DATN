import {
    LayoutDashboard,
    Users,
    GraduationCap,
    CheckSquare,
    FileBarChart,
    Settings,
    LogOut,
    BookOpen,
    Calendar,
    MapPin
} from 'lucide-react';

const ALL_MENU_ITEMS = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Học sinh', icon: GraduationCap, roles: ['admin', 'teacher'] },
    { id: 'teachers', label: 'Giáo viên', icon: Users, roles: ['admin'] },
    { id: 'classes', label: 'Quản lý Học phần', icon: BookOpen, roles: ['admin'] },
    { id: 'schedules', label: 'Lịch dạy', icon: Calendar, roles: ['admin', 'teacher'] },
    { id: 'locations', label: 'Vị trí (GPS)', icon: MapPin, roles: ['admin'] },
    { id: 'attendance', label: 'Điểm danh', icon: CheckSquare, roles: ['teacher'] },
    { id: 'reports', label: 'Báo cáo', icon: FileBarChart, roles: ['admin', 'teacher'] },
    { id: 'settings', label: 'Cài đặt', icon: Settings, roles: ['admin'] },
];

export function Sidebar({ currentPage, onNavigate, onLogout, user }) {
    const menuItems = ALL_MENU_ITEMS
        .filter(item => {
            const userRole = user?.role?.toLowerCase();
            return item.roles.some(r => r.toLowerCase() === userRole);
        })
        .map(item => {
            if (item.id === 'schedules' && user?.role?.toLowerCase() === 'teacher') {
                return { ...item, label: 'Lịch dạy' };
            }
            return item;
        });

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
            onLogout();
        }
    };

    return (
        <div className="w-64 min-h-screen flex flex-col bg-gradient-to-b from-indigo-700 to-indigo-900 shadow-xl">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-tight">BEER AI</h1>
                    <p className="text-indigo-300 text-xs">Quản lý điểm danh</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {menuItems.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className={`sidebar-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentPage === id ? 'bg-white/10 text-white shadow-inner font-semibold' : 'text-indigo-100 hover:bg-white/5'}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>

            {/* User profile & Logout */}
            <div className="px-3 py-4 border-t border-white/10">
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 group cursor-pointer transition-all"
                >
                    <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:bg-red-500 transition-colors">
                        {user?.role?.toLowerCase() === 'admin' ? 'AD' : 'GV'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-white text-sm font-medium group-hover:text-red-100 truncate">{user?.name || 'Người dùng'}</p>
                        <p className="text-indigo-300 text-[10px] uppercase tracking-wider font-bold">
                            {user?.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                        </p>
                    </div>
                    <LogOut size={15} className="text-indigo-300 group-hover:text-white" />
                </div>
            </div>
        </div>
    );
}
