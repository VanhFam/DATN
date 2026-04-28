import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { Classes } from './pages/Classes';
import { Schedules } from './pages/Schedules';
import { Locations } from './pages/Locations';
import { Attendance } from './pages/Attendance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';

const PAGE_COMPONENTS = {
    dashboard: Dashboard,
    students: Students,
    teachers: Teachers,
    classes: Classes,
    schedules: Schedules,
    locations: Locations,
    attendance: Attendance,
    reports: Reports,
    settings: Settings,
};

export default function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('attendance_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [currentPage, setCurrentPage] = useState('dashboard');

    useEffect(() => {
        if (user) {
            localStorage.setItem('attendance_user', JSON.stringify(user));

            const role = user.role?.toLowerCase();
            // Redirect admin/teacher to valid pages if they are on a restricted page
            if (role === 'admin') {
                // Admin không có trang attendance riêng, đã được xử lý ở sidebar
            } else if (role === 'teacher') {
                // Giáo viên không được vào trang quản lý người dùng và cài đặt hệ thống
                if (['teachers', 'settings', 'locations'].includes(currentPage)) {
                    setCurrentPage('dashboard');
                }
            }
        } else {
            localStorage.removeItem('attendance_user');
        }
    }, [user, currentPage]);

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('dashboard');
        localStorage.removeItem('attendance_user');
    };

    // 1. Lớp bảo vệ: Chưa đăng nhập
    if (!user) {
        return <Login onLogin={(u) => {
            localStorage.setItem('attendance_user', JSON.stringify(u));
            setUser(u);
            // Default page based on role
            if (u.role?.toLowerCase() === 'admin') setCurrentPage('teachers');
            else setCurrentPage('dashboard');
        }} />;
    }

    // 2. Dashboard dành cho học sinh
    if (user.role?.toLowerCase() === 'student') {
        return <StudentDashboard student={user} onLogout={handleLogout} />;
    }

    // 3. Giao diện dành cho Admin/Giáo viên
    const PageComponent = PAGE_COMPONENTS[currentPage] || Dashboard;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 animate-fade-in font-sans">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} user={user} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header currentPage={currentPage} user={user} />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <PageComponent user={user} />
                </main>
            </div>
        </div>
    );
}
