import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Attendance } from './pages/Attendance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';

const pages = {
    dashboard: Dashboard,
    students: Students,
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
        } else {
            localStorage.removeItem('attendance_user');
        }
    }, [user]);

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('dashboard');
    };

    // 1. Chưa đăng nhập
    if (!user) {
        if (typeof window !== 'undefined' && !window.__login_alerted) {
            alert("Hệ thống đã cập nhật mã nguồn mới. Nếu vẫn lỗi, hãy thử Refresh (Cmd+R) trang web.");
            window.__login_alerted = true;
        }
        console.log("App: No user found, rendering Login.");
        return <Login onLogin={(u) => {
            console.log("App: Received login data:", u);
            setUser(u);
        }} />;
    }

    console.log("App: User logged in:", user);

    // 2. Dashboard dành cho học sinh
    if (user.role === 'student') {
        return <StudentDashboard student={user} onLogout={handleLogout} />;
    }

    // 3. Giao diện dành cho giáo viên
    const PageComponent = pages[currentPage] || Dashboard;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 animate-fade-in">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header currentPage={currentPage} user={user} />
                <main className="flex-1 overflow-y-auto p-6">
                    <PageComponent user={user} />
                </main>
            </div>
        </div>
    );
}
