import { useState } from 'react';
import { School, Bell, Shield, Palette, Check, ShieldAlert } from 'lucide-react';

export function Settings({ user }) {
    const isTeacher = user?.role === 'teacher';
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        schoolName: 'Trường THPT Amsterdam',
        teacherName: 'Nguyễn Văn Thầy',
        email: 'giaovien@school.edu.vn',
        startTime: '07:00',
        lateAfter: '07:30',
        notifyParent: true,
        autoSave: true,
        theme: 'light',
    });

    const handle = (k, v) => {
        if (isTeacher) return;
        setForm(f => ({ ...f, [k]: v }));
        setSaved(false);
    };

    return (
        <div className="max-w-2xl space-y-5 animate-fade-in">
            {isTeacher && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700">
                    <ShieldAlert size={20} />
                    <p className="text-sm font-medium">Bạn đang đăng nhập với quyền <b>Giáo viên</b>. Bạn chỉ có thể xem cấu hình, không thể thay đổi thông tin hệ thống.</p>
                </div>
            )}

            {/* Thông tin trường */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                    <School size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">Thông tin trường học</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tên trường</label>
                        <input
                            className="input"
                            value={form.schoolName}
                            onChange={e => handle('schoolName', e.target.value)}
                            disabled={isTeacher}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tên giáo viên quản lý</label>
                            <input
                                className="input"
                                value={form.teacherName}
                                onChange={e => handle('teacherName', e.target.value)}
                                disabled={isTeacher}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email liên hệ</label>
                            <input
                                type="email"
                                className="input"
                                value={form.email}
                                onChange={e => handle('email', e.target.value)}
                                disabled={isTeacher}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quy tắc điểm danh */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                    <Shield size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">Quy tắc điểm danh</h3>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Giờ bắt đầu học</label>
                            <input
                                type="time"
                                className="input"
                                value={form.startTime}
                                onChange={e => handle('startTime', e.target.value)}
                                disabled={isTeacher}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tính là muộn sau</label>
                            <input
                                type="time"
                                className="input"
                                value={form.lateAfter}
                                onChange={e => handle('lateAfter', e.target.value)}
                                disabled={isTeacher}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        {[
                            { key: 'notifyParent', label: 'Tự động gửi thông báo cho phụ huynh khi vắng', icon: Bell },
                            { key: 'autoSave', label: 'Tự động lưu bảng điểm danh sau mỗi 5 phút', icon: Check },
                        ].map(({ key, label, icon: Icon }) => (
                            <label key={key} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${isTeacher ? 'opacity-70 grayscale-[0.5]' : 'cursor-pointer hover:bg-slate-50 border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={form[key]}
                                    onChange={() => handle(key, !form[key])}
                                    disabled={isTeacher}
                                />
                                <Icon size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Giao diện */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                    <Palette size={18} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">Giao diện</h3>
                </div>
                <div className="flex gap-3">
                    {['light', 'dark', 'system'].map(t => (
                        <button
                            key={t}
                            onClick={() => handle('theme', t)}
                            disabled={isTeacher}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize
                                ${form.theme === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-200'}
                                ${isTeacher ? 'opacity-50' : ''}`}
                        >
                            {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Hệ thống'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Save info */}
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-sm text-gray-500 italic">
                    {isTeacher ? "Thông tin được bảo vệ bởi Admin." : "Thay đổi sẽ được áp dụng cho toàn hệ thống."}
                </div>
                <button
                    className={`btn-primary px-8 py-2.5 ${isTeacher ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={isTeacher ? null : () => setSaved(true)}
                    disabled={isTeacher}
                >
                    <Check size={18} /> Lưu cấu hình
                </button>
            </div>
            {saved && (
                <div className="text-center animate-fade-in">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold border border-emerald-100 italic">
                        <Check size={16} /> Cài đặt đã được lưu thành công!
                    </span>
                </div>
            )}
        </div>
    );
}
