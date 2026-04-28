import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
    School, Bell, Shield, Palette, Check, ShieldAlert, Users, 
    Lock, Mail, User, Eye, EyeOff, MapPin, Cpu, Camera, 
    Clock, Calendar, Trash2, Edit2, UserMinus, UserCheck, Search, Loader2
} from 'lucide-react';

export function Settings({ user: currentUser }) {
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
    const [activeTab, setActiveTab] = useState('account');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Filtered users for User Management tab
    const [searchTerm, setSearchTerm] = useState('');
    const [userList, setUserList] = useState([]);
    
    // Settings state
    const [settings, setSettings] = useState({
        // Account
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        
        // Attendance Rules
        checkInEarly: 15,
        gpsRadius: 100,
        requireFace: true,
        allowLate: true,
        allowReAttendance: false,
        
        // AI Config
        confidenceThreshold: 0.85,
        aiEnabled: true,
        maxRetries: 3,
        saveFaceImages: true,
        
        // General
        schoolName: 'Attendance AI School',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, configData] = await Promise.all([
                isAdmin ? api.get('/users') : Promise.resolve([]),
                api.get('/settings')
            ]);
            
            if (isAdmin) setUserList(usersData);
            
            // Map backend settings to local state
            if (configData && Object.keys(configData).length > 0) {
                setSettings(prev => ({
                    ...prev,
                    checkInEarly: parseInt(configData.checkInEarly) || prev.checkInEarly,
                    gpsRadius: parseInt(configData.gpsRadius) || prev.gpsRadius,
                    requireFace: configData.requireFace === 'true',
                    allowLate: configData.allowLate === 'true',
                    allowReAttendance: configData.allowReAttendance === 'true',
                    confidenceThreshold: parseFloat(configData.confidenceThreshold) || prev.confidenceThreshold,
                    aiEnabled: configData.aiEnabled === 'true',
                    maxRetries: parseInt(configData.maxRetries) || prev.maxRetries,
                    saveFaceImages: configData.saveFaceImages === 'true',
                    schoolName: configData.schoolName || prev.schoolName,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleField = (k, v) => {
        setSettings(s => ({ ...s, [k]: v }));
        setSaved(false);
    };

    const toggleUserStatus = async (user) => {
        if (user.username === currentUser.username) {
            alert('Bạn không thể tự khóa tài khoản của chính mình!');
            return;
        }
        try {
            await api.patch(`/users/${user.id}/toggle-active`);
            setUserList(prev => prev.map(u => 
                u.id === user.id ? { ...u, isActive: !u.isActive } : u
            ));
        } catch (error) {
            alert('Lỗi cập nhật trạng thái: ' + error.message);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Save Profile
            try {
                await api.patch('/users/profile', {
                    name: settings.name || '',
                    email: settings.email || ''
                });
                
                // Cập nhật localStorage để đồng bộ giao diện
                const user = JSON.parse(localStorage.getItem('attendance_user'));
                if (user) {
                    user.name = settings.name;
                    user.email = settings.email;
                    localStorage.setItem('attendance_user', JSON.stringify(user));
                    
                    // Cập nhật tên trong danh sách Người dùng (nếu đang hiển thị)
                    setUserList(prev => prev.map(u => 
                        u.username === currentUser.username ? { ...u, name: settings.name } : u
                    ));

                    // Dispatch sự kiện để Header/Sidebar cập nhật
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (err) {
                throw new Error('Không thể cập nhật hồ sơ: ' + err.message);
            }

            // 2. Save System Settings (Admin only)
            if (isAdmin) {
                try {
                    const configToSave = {
                        checkInEarly: (settings.checkInEarly ?? 15).toString(),
                        gpsRadius: (settings.gpsRadius ?? 100).toString(),
                        requireFace: (settings.requireFace ?? true).toString(),
                        allowLate: (settings.allowLate ?? true).toString(),
                        allowReAttendance: (settings.allowReAttendance ?? false).toString(),
                        confidenceThreshold: (settings.confidenceThreshold ?? 0.85).toString(),
                        aiEnabled: (settings.aiEnabled ?? true).toString(),
                        maxRetries: (settings.maxRetries ?? 3).toString(),
                        saveFaceImages: (settings.saveFaceImages ?? true).toString(),
                        schoolName: settings.schoolName || 'Attendance AI School',
                    };
                    await api.post('/settings', configToSave);
                } catch (err) {
                    throw new Error('Không thể cập nhật cấu hình hệ thống: ' + err.message);
                }
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Save Error:', error);
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwords.current || !passwords.new) {
            alert('Vui lòng nhập đầy đủ mật khẩu');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            alert('Mật khẩu mới không khớp');
            return;
        }
        try {
            await api.post('/users/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            alert('Đổi mật khẩu thành công');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const filteredUsers = userList.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'account', label: 'Tài khoản', icon: User },
        { id: 'users', label: 'Người dùng', icon: Users, adminOnly: true },
        { id: 'attendance', label: 'Luật điểm danh', icon: Lock, adminOnly: true },
        { id: 'ai', label: 'Cấu hình AI', icon: Cpu, adminOnly: true },
    ];

    const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
                <p className="font-bold">Đang tải cấu hình hệ thống...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Cài đặt hệ thống</h2>
                    <p className="text-sm text-gray-400">Cấu hình các thông số vận hành và quản lý tài khoản</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 animate-slide-up">
                        <Check size={14} strokeWidth={3} /> Đã lưu thành công
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm
                                ${activeTab === tab.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' 
                                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Tab 1: Account */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <User size={20} className="text-indigo-500" /> Hồ sơ cá nhân
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-8">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-3xl border-2 border-dashed border-indigo-200 group-hover:bg-indigo-100 transition-all">
                                                {settings.name[0] || 'U'}
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600">
                                                <Camera size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-gray-700">{settings.name}</h4>
                                            <p className="text-sm text-gray-400 font-medium">{currentUser?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Tên hiển thị</label>
                                            <div className="relative">
                                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input className="input pl-11" value={settings.name} onChange={e => handleField('name', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Email liên hệ</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input className="input pl-11" value={settings.email} onChange={e => handleField('email', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Lock size={20} className="text-indigo-500" /> Bảo mật & Mật khẩu
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Mật khẩu hiện tại</label>
                                        <input type="password" placeholder="••••••••" className="input" 
                                            value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Mật khẩu mới</label>
                                            <input type="password" placeholder="••••••••" className="input" 
                                                value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Xác nhận mật khẩu</label>
                                            <input type="password" placeholder="••••••••" className="input" 
                                                value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button onClick={handlePasswordChange} className="btn-secondary w-full justify-center py-3">Cập nhật mật khẩu</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Users (Admin Only) */}
                    {activeTab === 'users' && isAdmin && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card p-0 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white sticky top-0 z-10">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                                        <Users size={20} className="text-indigo-500" /> Quản lý Người dùng
                                    </h3>
                                    <div className="relative flex-1 max-w-md">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            placeholder="Tìm theo tên hoặc username..." 
                                            className="input pl-10 h-10 text-sm" 
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto max-h-[600px]">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Thành viên</th>
                                                <th className="px-6 py-4 text-left">Vai trò</th>
                                                <th className="px-6 py-4 text-left">Trạng thái</th>
                                                <th className="px-6 py-4 text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${!u.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                                {u.name[0] || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-700">{u.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-medium font-mono uppercase tracking-tighter">{u.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider
                                                            ${u.role === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                              u.role === 'TEACHER' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                                                              'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                            <span className={`text-[11px] font-bold ${u.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => toggleUserStatus(u)}
                                                            className={`p-2 rounded-lg transition-all ${u.isActive ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                            title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                                                        >
                                                            {u.isActive ? <UserMinus size={15} /> : <UserCheck size={15} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Attendance Rules */}
                    {activeTab === 'attendance' && isAdmin && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Shield size={20} className="text-indigo-500" /> Thiết lập Luật điểm danh
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Thời gian mở check-in sớm (Phút)</label>
                                            <div className="relative">
                                                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="number" className="input pl-11" value={settings.checkInEarly} onChange={e => handleField('checkInEarly', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bán kính GPS hợp lệ (Meters)</label>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="number" className="input pl-11" value={settings.gpsRadius} onChange={e => handleField('gpsRadius', parseInt(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 md:pt-6">
                                        {[
                                            { key: 'requireFace', label: 'Bắt buộc nhận diện khuôn mặt', icon: Camera },
                                            { key: 'allowLate', label: 'Cho phép điểm danh muộn', icon: Clock },
                                            { key: 'allowReAttendance', label: 'Cho phép điểm danh lại', icon: Bell },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <item.icon size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full transition-all relative ${settings[item.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings[item.key] ? 'left-6' : 'left-1'}`} />
                                                    <input type="checkbox" className="hidden" checked={settings[item.key]} onChange={() => handleField(item.key, !settings[item.key])} />
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: AI Config */}
                    {activeTab === 'ai' && isAdmin && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="card">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Cpu size={20} className="text-indigo-500" /> Cấu hình Nhận diện AI
                                </h3>
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <h4 className="font-black text-xl mb-1 flex items-center gap-2">
                                                    Trạng thái AI: <span className="text-emerald-400">Đang chạy</span>
                                                </h4>
                                                <p className="text-slate-400 text-sm">Hệ thống đang sử dụng Model FaceAPI-v2-stable</p>
                                            </div>
                                            <button 
                                                onClick={() => handleField('aiEnabled', !settings.aiEnabled)}
                                                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${settings.aiEnabled ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-900/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-900/20'}`}
                                            >
                                                {settings.aiEnabled ? 'Tạm dừng AI' : 'Kích hoạt AI'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Độ tin cậy Model (Confidence)</label>
                                                <span className="text-indigo-600 font-black text-sm">{Math.round(settings.confidenceThreshold * 100)}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0.5" max="0.99" step="0.01" 
                                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                value={settings.confidenceThreshold}
                                                onChange={e => handleField('confidenceThreshold', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Số lần thử lại tối đa (Retry)</label>
                                            <input type="number" className="input" value={settings.maxRetries} onChange={e => handleField('maxRetries', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="sticky bottom-6 flex items-center justify-end">
                        <div className="flex items-center gap-4 p-2 bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-2xl">
                            <button className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">Hủy thay đổi</button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`btn-primary px-10 py-3 shadow-lg shadow-indigo-200 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                                {isSaving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
