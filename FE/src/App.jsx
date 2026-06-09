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
import { Semesters } from './pages/Semesters';
import { Login } from './pages/Login';

const PAGE_COMPONENTS = {
    dashboard: Dashboard,
    students: Students,
    teachers: Teachers,
    classes: Classes,
    schedules: Schedules,
    locations: Locations,
    attendance: Attendance,
    reports: Reports,
    semesters: Semesters,
    settings: Settings,
};

export default function App() {
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem('attendance_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [currentPage, setCurrentPage] = useState('dashboard');

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('attendance_user', JSON.stringify(user));

            const role = user.role?.toLowerCase();
            if (role === 'teacher') {
                if (['teachers', 'locations'].includes(currentPage)) {
                    setCurrentPage('dashboard');
                }
            }
        } else {
            sessionStorage.removeItem('attendance_user');
        }
    }, [user, currentPage]);

    const handleLogout = () => {
        setUser(null);
        setCurrentPage('dashboard');
        sessionStorage.removeItem('attendance_user');
    };

    if (!user) {
        return (
            <Login onLogin={(u) => {
                sessionStorage.setItem('attendance_user', JSON.stringify(u));
                setUser(u);
                setCurrentPage('dashboard');
            }} />
        );
    }

    if (user.role?.toLowerCase() === 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center animate-scale-in">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8v6m0-6V7m0 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
                    <p className="text-gray-500 mb-6 leading-relaxed">Hệ thống Web hiện chỉ dành cho Cán bộ và Giáo viên. Vui lòng sử dụng ứng dụng di động để thực hiện điểm danh và xem lịch học.</p>
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
                    >
                        Quay lại đăng nhập
                    </button>
                </div>
            </div>
        );
    }

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
