import { Search, Bell, User, ChevronRight } from 'lucide-react';

const pageTitles = {
    dashboard: 'Tổng quan',
    students: 'Học sinh',
    attendance: 'Điểm danh',
    reports: 'Báo cáo',
    settings: 'Cài đặt',
};

export function Header({ currentPage, user }) {
    const pageTitle = pageTitles[currentPage] || 'Tổng quan';

    return (
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">{pageTitle}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>Hệ thống</span>
                    <ChevronRight size={12} />
                    <span className="text-indigo-500 font-medium capitalize prose-sm">{currentPage}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name || 'Người dùng'}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 border-2 border-white">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}
