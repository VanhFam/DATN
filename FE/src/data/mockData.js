// Dữ liệu mẫu cho hệ thống quản lý điểm danh

export const classes = ['10A1', '10A2', '11B1', '11B2', '12C1'];

export const students = [
    { id: 'HS001', name: 'Nguyễn Văn An', class: '10A1', gender: 'Nam', dob: '2008-05-12', phone: '0901234567', avatar: null },
    { id: 'HS002', name: 'Trần Thị Bình', class: '10A1', gender: 'Nữ', dob: '2008-03-22', phone: '0912345678', avatar: null },
    { id: 'HS003', name: 'Lê Văn Cường', class: '10A1', gender: 'Nam', dob: '2008-07-15', phone: '0923456789', avatar: null },
    { id: 'HS004', name: 'Phạm Thị Dung', class: '10A1', gender: 'Nữ', dob: '2008-01-30', phone: '0934567890', avatar: null },
    { id: 'HS005', name: 'Hoàng Văn Em', class: '10A1', gender: 'Nam', dob: '2008-11-08', phone: '0945678901', avatar: null },
    { id: 'HS006', name: 'Vũ Thị Phương', class: '10A2', gender: 'Nữ', dob: '2008-06-20', phone: '0956789012', avatar: null },
    { id: 'HS007', name: 'Đặng Văn Giỏi', class: '10A2', gender: 'Nam', dob: '2008-09-14', phone: '0967890123', avatar: null },
    { id: 'HS008', name: 'Bùi Thị Hoa', class: '10A2', gender: 'Nữ', dob: '2008-02-28', phone: '0978901234', avatar: null },
    { id: 'HS009', name: 'Ngô Văn Ích', class: '11B1', gender: 'Nam', dob: '2007-04-17', phone: '0989012345', avatar: null },
    { id: 'HS010', name: 'Dương Thị Kim', class: '11B1', gender: 'Nữ', dob: '2007-08-25', phone: '0990123456', avatar: null },
    { id: 'HS011', name: 'Trịnh Văn Long', class: '11B1', gender: 'Nam', dob: '2007-12-03', phone: '0901234568', avatar: null },
    { id: 'HS012', name: 'Lương Thị Mai', class: '11B2', gender: 'Nữ', dob: '2007-10-19', phone: '0912345679', avatar: null },
    { id: 'HS013', name: 'Đinh Văn Nam', class: '11B2', gender: 'Nam', dob: '2007-07-07', phone: '0923456780', avatar: null },
    { id: 'HS014', name: 'Cao Thị Oanh', class: '12C1', gender: 'Nữ', dob: '2006-03-11', phone: '0934567891', avatar: null },
    { id: 'HS015', name: 'Phan Văn Phúc', class: '12C1', gender: 'Nam', dob: '2006-06-30', phone: '0945678902', avatar: null },
    { id: 'STUDENT', name: 'Học sinh Thử nghiệm', class: '10A1', gender: 'Nam', dob: '2008-01-01', phone: '0900000000', avatar: null },
];

// Sinh dữ liệu điểm danh cho 30 ngày gần đây
const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
function randomStatus() {
    return statuses[Math.floor(Math.random() * statuses.length)];
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getRecentDates(n) {
    const dates = [];
    const today = new Date('2026-03-31');
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getDay() !== 0 && d.getDay() !== 6) { // bỏ cuối tuần
            dates.push(formatDate(d));
        }
    }
    return dates;
}

export const recentDates = getRecentDates(40).slice(-22); // ~22 ngày học

export const attendanceRecords = [];
students.forEach(student => {
    recentDates.forEach((date, idx) => {
        const status = idx === recentDates.length - 1
            ? randomStatus()
            : randomStatus();
        attendanceRecords.push({
            id: `${student.id}_${date}`,
            studentId: student.id,
            studentName: student.name,
            class: student.class,
            date,
            status,
            time: status === 'present' ? '07:' + String(30 + Math.floor(Math.random() * 20)).padStart(2, '0')
                : status === 'late' ? '08:' + String(Math.floor(Math.random() * 30)).padStart(2, '0')
                    : null,
        });
    });
});

export const today = '2026-03-31';

export function getTodayStats(cls = null) {
    const todayRecords = attendanceRecords.filter(r =>
        r.date === today && (cls ? r.class === cls : true)
    );
    return {
        total: todayRecords.length,
        present: todayRecords.filter(r => r.status === 'present').length,
        absent: todayRecords.filter(r => r.status === 'absent').length,
        late: todayRecords.filter(r => r.status === 'late').length,
    };
}

export function getWeeklyStats() {
    const last7 = recentDates.slice(-7);
    return last7.map(date => {
        const records = attendanceRecords.filter(r => r.date === date);
        const present = records.filter(r => r.status === 'present').length;
        const total = records.length || 1;
        return { date, rate: Math.round((present / total) * 100) };
    });
}
