import * as XLSX from 'xlsx';

const STATUS_LABEL = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Muộn',
    half: 'Nửa buổi',
};

// Hàm tự động tính toán độ rộng cột dựa trên nội dung
export const getAutoColumnWidths = (data) => {
    if (!data || data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map(key => {
        let maxLen = key.toString().length;
        data.forEach(row => {
            const val = row[key] ? row[key].toString() : "";
            if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 2 }; // Thêm 2 ký tự đệm
    });
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

    // Tự động điều chỉnh độ rộng cột
    ws['!cols'] = getAutoColumnWidths(data);

    XLSX.writeFile(wb, `diemdanh_${className}_${date}.xlsx`);
}

/**
 * Xuất báo cáo tổng hợp học kỳ ra Excel
 */
export function exportSemesterReportExcel({ className, semesterName, totalSessions, students, records, summary }) {
    const rows = summary || students.map(s => {
        const sr = records.filter(r => r.studentId === s.id);
        const present = sr.filter(r => r.status === 'present').length;
        const absent = sr.filter(r => r.status === 'absent').length;
        const late = sr.filter(r => r.status === 'late').length;
        const half = sr.filter(r => r.status === 'half').length;
        const score = present + (late * 0.75) + (half * 0.5);
        const rate = totalSessions ? Math.round((score / totalSessions) * 100) : 0;
        return { ...s, present, absent, late, half, rate };
    });

    const data = rows.map((s, i) => ({
        'STT': i + 1,
        'Mã học sinh': s.id,
        'Họ và tên': s.name,
        'Có mặt': s.present,
        'Vắng': s.absent,
        'Muộn': s.late,
        'Nửa buổi': s.half,
        'Tổng buổi': totalSessions || s.total || 0,
        'Tỉ lệ (%)': `${s.rate}%`,
        'Kết quả': s.rate >= 100 ? 'CHUYÊN CẦN' : s.rate < 70 ? 'CẤM THI' : s.rate < 80 ? 'CẢNH BÁO' : 'ĐẠT',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = semesterName ? semesterName.slice(0, 31) : 'Tổng hợp học kỳ';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    ws['!cols'] = getAutoColumnWidths(data);

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
        const present = studentRecords.filter(r => r.status === 'present').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const half = studentRecords.filter(r => r.status === 'half').length;
        row['% Chuyên cần'] = dates.length > 0 
            ? Math.round(((present + late * 0.75 + half * 0.5) / dates.length) * 100) + '%'
            : '0%';

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi tiết điểm danh");

    ws['!cols'] = getAutoColumnWidths(data);

    XLSX.writeFile(wb, `baocao_chitiet_${className}_${fromDate}_to_${toDate}.xlsx`);
}
