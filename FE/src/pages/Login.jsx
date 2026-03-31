import { useState } from 'react';
import { GraduationCap, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { students } from '../data/mockData';

export function Login({ onLogin }) {
    const [role, setRole] = useState('teacher'); // 'admin' | 'teacher' | 'student'
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const trimmedId = id.trim();
        const trimmedPass = password.trim();

        console.log(`Login: Attempting login as ${role} with ID: "${trimmedId}"`);

        if (role === 'admin') {
            if (trimmedId === 'admin' && trimmedPass === 'admin') {
                onLogin({ role: 'admin', id: 'admin', name: 'Quản trị viên' });
            } else {
                setError('Sai thông tin Admin (admin/admin)');
            }
        } else if (role === 'teacher') {
            if (trimmedId === 'teacher' && trimmedPass === 'teacher') {
                onLogin({ role: 'teacher', id: 'teacher', name: 'Nguyễn Văn Thầy' });
            } else {
                setError('Sai thông tin Giáo viên (teacher/teacher)');
            }
        } else {
            const student = students.find(s => s.id === trimmedId);
            if (student) {
                onLogin({ role: 'student', id: student.id, name: student.name, class: student.class });
            } else {
                setError('Mã học sinh không tồn tại');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in relative z-10">
                <div className="p-8 pb-4 text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center mx-auto mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <GraduationCap className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance AI</h1>
                    <p className="text-gray-500 text-sm mt-1">Hệ thống điểm danh thông minh</p>
                </div>

                {/* Role Selector */}
                <div className="flex p-1 bg-gray-100 rounded-xl mx-6 mt-4">
                    <button
                        onClick={() => { setRole('admin'); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${role === 'admin' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ShieldCheck size={14} /> Admin
                    </button>
                    <button
                        onClick={() => { setRole('teacher'); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${role === 'teacher' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <GraduationCap size={14} /> G.Viên
                    </button>
                    <button
                        onClick={() => { setRole('student'); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${role === 'student' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User size={14} /> H.Sinh
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 ml-1">
                            {role === 'student' ? 'Mã học sinh' : 'Tên đăng nhập'}
                        </label>
                        <div className="relative group">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder={role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'Ví dụ: HS001'}
                                value={id}
                                onChange={e => setId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 ml-1">Mật khẩu</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="password"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 animate-fade-in flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-600 rounded-full" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-6"
                    >
                        Đăng nhập
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="pt-4 text-center">
                        <a href="#" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">Quên mật khẩu? Liên hệ quản trị viên</a>
                    </div>
                </form>

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">© 2026 Attendance AI System. Phiên bản 1.0.0</p>
                </div>
            </div>
        </div>
    );
}
