import * as XLSX from 'xlsx';

const STATUS_LABEL = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Muộn',
};

/**
 * Xuất báo cáo điểm danh ngày ra Excel
 */
export function exportDailyAttendanceExcel({ className, date, students, attendanceMap }) {
    const data = students.map((s, i) => ({
        'STT': i + 1,
        'Mã học sinh': s.id,
        'Họ và tên': s.name,
        'Lớp': s.class,
        'Trạng thái': STATUS_LABEL[attendanceMap[s.id]] || 'Chưa xác định',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Điểm danh");

    // Điều chỉnh độ rộng cột
    ws['!cols'] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 25 },
        { wch: 10 },
        { wch: 15 },
    ];

    XLSX.writeFile(wb, `diemdanh_${className}_${date}.xlsx`);
}

/**
 * Xuất báo cáo tổng hợp học kỳ ra Excel
 */
export function exportSemesterReportExcel({ className, students, records }) {
    const data = students.map((s, i) => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const total = studentRecords.length || 0;
        const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return {
            'STT': i + 1,
            'Mã học sinh': s.id,
            'Họ và tên': s.name,
            'Tổng buổi học': total,
            'Số buổi có mặt': present,
            'Số buổi vắng': absent,
            'Số buổi muộn': late,
            'Tỷ lệ chuyên cần (%)': `${attendanceRate}%`
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tổng hợp học kỳ");

    ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.writeFile(wb, `tonghop_hocky_${className}.xlsx`);
}

/**
 * Xuất chi tiết điểm danh theo phạm vi ngày ra Excel (Bảng Matrix)
 */
export function exportAttendanceRangeExcel({ className, fromDate, toDate, students, dates, records }) {
    const data = students.map((s, i) => {
        const row = {
            'STT': i + 1,
            'Mã HS': s.id,
            'Họ tên': s.name,
        };

        dates.forEach(date => {
            const rec = records.find(r => r.studentId === s.id && r.date === date);
            const status = rec ? STATUS_LABEL[rec.status] : '—';
            row[date] = status;
        });

        // Thêm tổng hợp cuối dòng
        const studentRecords = records.filter(r => r.studentId === s.id);
        row['Vắng'] = studentRecords.filter(r => r.status === 'absent').length;
        row['% Chuyên cần'] = dates.length > 0 
            ? Math.round(((studentRecords.filter(r => r.status === 'present' || r.status === 'late').length) / dates.length) * 100) + '%'
            : '0%';

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiết điểm danh");

    ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 25 }, 
        ...dates.map(() => ({ wch: 12 })),
        { wch: 8 }, { wch: 15 }
    ];

    XLSX.writeFile(wb, `baocao_chitiet_${className}_${fromDate}_to_${toDate}.xlsx`);
}
