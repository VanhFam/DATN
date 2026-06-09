import { useState } from 'react';
import { GraduationCap, User, Lock, ArrowRight, Sparkles, ShieldCheck, ScanFace } from 'lucide-react';
import { api } from '../utils/api';

export function Login({ onLogin }) {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.post('/auth/login', {
                username: id.trim(),
                password: password.trim()
            });
            // Backend returns: { token, tokenType, id, username, name, role, email }
            if (data.role?.toLowerCase() === 'student') {
                setError('Sinh viên vui lòng sử dụng ứng dụng di động để đăng nhập.');
                return;
            }
            onLogin(data);
        } catch (err) {
            setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 sm:p-6">
            <img
                src="/tlu-campus.jpg"
                alt="Khuôn viên Trường Đại học Thăng Long"
                className="absolute inset-0 h-full w-full object-cover opacity-45 animate-login-photo"
            />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(49,46,129,0.94)_0%,rgba(67,56,202,0.84)_44%,rgba(30,64,175,0.72)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-24 bg-white/10 backdrop-blur-[1px]" />

            <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/20 bg-white/95 shadow-2xl animate-scale-in lg:grid lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative hidden min-h-[640px] overflow-hidden lg:block">
                    <img
                        src="/tlu-campus.jpg"
                        alt="Trường Đại học Thăng Long"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.18)_38%,rgba(15,23,42,0.88)_100%)]" />
                    <div className="absolute left-8 top-8 flex items-center gap-3 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-white shadow-lg backdrop-blur-md">
                        <GraduationCap size={19} />
                        <span className="text-sm font-bold tracking-wide">THANG LONG UNIVERSITY</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                            <Sparkles size={14} />
                            Attendance AI System
                        </div>
                        <h1 className="max-w-xl text-4xl font-black leading-tight">
                        Hệ thống điểm danh và quản lý sinh viên Ứng dụng nhận dạng khuôn mặt.
                        </h1>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
                            Cổng quản trị dành cho cán bộ và giảng viên, hỗ trợ theo dõi lớp học, lịch dạy và dữ liệu điểm danh theo thời gian thực.
                        </p>
                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                                <ShieldCheck size={20} className="mb-3 text-emerald-200" />
                                <p className="text-xs font-bold uppercase tracking-wider text-white/60">Quản trị</p>
                                <p className="mt-1 text-sm font-semibold">Phân quyền theo vai trò</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                                <ScanFace size={20} className="mb-3 text-sky-200" />
                                <p className="text-xs font-bold uppercase tracking-wider text-white/60">Nhận diện</p>
                                <p className="mt-1 text-sm font-semibold">Dữ liệu khuôn mặt đồng bộ</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10 space-y-5 bg-white">
                    <div className="pb-2">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center mb-5 rotate-3 hover:rotate-0 transition-transform duration-300">
                            <GraduationCap className="text-white" size={30} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600">Đại học Thăng Long</p>
                        <h2 className="mt-2 text-3xl font-black text-gray-900">Đăng nhập hệ thống</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                        Hệ thống điểm danh và quản lý sinh viên Ứng dụng nhận dạng khuôn mặt.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 ml-1">Tên đăng nhập / Mã học sinh</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                placeholder="Tên đăng nhập hoặc Mã HS..."
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
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập hệ thống'}
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="pt-4 text-center">
                        <a href="#" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium">Quên mật khẩu? Liên hệ phòng đào tạo</a>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-medium">© 2026 Attendance AI System. Phiên bản 1.0.0</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
