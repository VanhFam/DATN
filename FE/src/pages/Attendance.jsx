import { useState } from 'react';
import { students, classes, attendanceRecords } from '../data/mockData';
import { today } from '../data/mockData';
import { Camera, Check, X, Minus, Save, RefreshCw, ShieldAlert, FileText } from 'lucide-react';
import { exportDailyAttendancePDF } from '../utils/pdfExport';

const STATUS_LABEL = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn' };

function StatusButton({ status, current, onClick, disabled }) {
    const styles = {
        present: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'present' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        absent: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'absent' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
        late: `border-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${current === 'late' ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    };
    return (
        <button className={styles[status]} onClick={disabled ? null : onClick} disabled={disabled}>
            {STATUS_LABEL[status]}
        </button>
    );
}

export function Attendance({ user }) {
    const [selectedClass, setSelectedClass] = useState(classes[0]);
    const [selectedDate, setSelectedDate] = useState(today);
    const [saved, setSaved] = useState(false);

    const isTeacher = user?.role === 'teacher';
    const isHistory = selectedDate !== today;
    const canEdit = !isTeacher || !isHistory;

    const classStudents = students.filter(s => s.class === selectedClass);

    const existingRecords = {};
    attendanceRecords
        .filter(r => r.class === selectedClass && r.date === selectedDate)
        .forEach(r => { existingRecords[r.studentId] = r.status; });

    const [attendance, setAttendance] = useState(() => {
        const init = {};
        students.filter(s => s.class === selectedClass).forEach(s => {
            init[s.id] = existingRecords[s.id] || 'present';
        });
        return init;
    });

    const updateClass = (cls) => {
        setSelectedClass(cls);
        const newStudents = students.filter(s => s.class === cls);
        const newRecords = {};
        attendanceRecords
            .filter(r => r.class === cls && r.date === selectedDate)
            .forEach(r => { newRecords[r.studentId] = r.status; });
        const init = {};
        newStudents.forEach(s => { init[s.id] = newRecords[s.id] || 'present'; });
        setAttendance(init);
        setSaved(false);
    };

    const markAll = (status) => {
        const updated = {};
        classStudents.forEach(s => { updated[s.id] = status; });
        setAttendance(updated);
        setSaved(false);
    };

    const setStatus = (id, status) => {
        setAttendance(prev => ({ ...prev, [id]: status }));
        setSaved(false);
    };

    const handleSave = () => setSaved(true);

    const counts = { present: 0, absent: 0, late: 0 };
    classStudents.forEach(s => counts[attendance[s.id]]++);

    return (
        <div className="space-y-5 animate-fade-in">
            {isTeacher && isHistory && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-700">
                    <ShieldAlert size={20} />
                    <p className="text-sm font-medium">Bạn đang xem lịch sử điểm danh. Quyền <b>Giáo viên</b> không được phép thay đổi dữ liệu quá khứ.</p>
                </div>
            )}
            {/* Controls */}
            <div className="card">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
                        <select className="input w-36" value={selectedClass} onChange={e => updateClass(e.target.value)}>
                            {classes.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                        <input type="date" className="input w-44" value={selectedDate}
                            onChange={e => { setSelectedDate(e.target.value); setSaved(false); }} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button className={`btn-secondary text-xs py-1.5 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={canEdit ? () => markAll('present') : null} disabled={!canEdit}>
                            <Check size={13} className="text-emerald-600" /> Tất cả có mặt
                        </button>
                        <button className={`btn-secondary text-xs py-1.5 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={canEdit ? () => markAll('absent') : null} disabled={!canEdit}>
                            <X size={13} className="text-red-500" /> Tất cả vắng
                        </button>
                        <button className={`btn-secondary text-xs py-1.5 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={canEdit ? () => markAll('late') : null} disabled={!canEdit}>
                            <Minus size={13} className="text-orange-500" /> Tất cả muộn
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Camera box */}
                <div className="card flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Camera size={18} className="text-indigo-500" />
                        <h3 className="font-semibold text-gray-800">Camera AI</h3>
                        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Đang hoạt động
                        </span>
                    </div>
                    <div className="bg-gray-900 rounded-xl flex-1 min-h-52 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full border-4 border-dashed border-indigo-400 flex items-center justify-center">
                            <Camera size={28} className="text-indigo-400" />
                        </div>
                        <p className="text-gray-400 text-sm">Camera nhận diện khuôn mặt</p>
                        <p className="text-gray-600 text-xs">Đang nhận diện lớp {selectedClass}...</p>
                    </div>
                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-emerald-50 p-2 rounded-lg text-center">
                            <p className="text-lg font-bold text-emerald-600">{counts.present}</p>
                            <p className="text-xs text-emerald-500">Có mặt</p>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg text-center">
                            <p className="text-lg font-bold text-red-600">{counts.absent}</p>
                            <p className="text-xs text-red-500">Vắng</p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg text-center">
                            <p className="text-lg font-bold text-orange-600">{counts.late}</p>
                            <p className="text-xs text-orange-500">Muộn</p>
                        </div>
                    </div>
                </div>

                {/* Attendance list */}
                <div className="card xl:col-span-2 p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">
                            Danh sách điểm danh — Lớp {selectedClass}
                        </h3>
                        {saved
                            ? <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium mr-2"><Check size={15} /> Đã lưu</span>
                                <button className="btn-secondary py-1.5 flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => exportDailyAttendancePDF({
                                        className: selectedClass,
                                        date: selectedDate,
                                        students: classStudents,
                                        attendanceMap: attendance
                                    })}>
                                    <FileText size={14} /> Xuất PDF
                                </button>
                            </div>
                            : <button className={`btn-primary py-1.5 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={canEdit ? handleSave : null} disabled={!canEdit}>
                                <Save size={14} /> Lưu điểm danh
                            </button>
                        }
                    </div>
                    <div className="overflow-y-auto max-h-[420px]">
                        <table className="w-full text-sm">
                            <thead className="table-head sticky top-0 bg-slate-50 z-10">
                                <tr>
                                    <th className="text-left px-5 py-3">Học sinh</th>
                                    <th className="text-center px-5 py-3">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map((s, i) => (
                                    <tr key={s.id} className="table-row">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {s.name.split(' ').pop()[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{s.name}</p>
                                                    <p className="text-xs text-gray-400">{s.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <StatusButton status="present" current={attendance[s.id]} onClick={() => setStatus(s.id, 'present')} disabled={!canEdit} />
                                                <StatusButton status="late" current={attendance[s.id]} onClick={() => setStatus(s.id, 'late')} disabled={!canEdit} />
                                                <StatusButton status="absent" current={attendance[s.id]} onClick={() => setStatus(s.id, 'absent')} disabled={!canEdit} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
