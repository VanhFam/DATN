import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold } from './fonts';

const setupFonts = (doc) => {
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
    doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto');
};

const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(150);
        doc.text(
            `Trang ${i}/${pageCount}  |  Attendance AI - Hệ thống quản lý điểm danh`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 5,
            { align: 'center' }
        );
    }
};

const STATUS_LABEL = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Muộn',
    half: 'Nửa buổi',
};

const TABLE_STYLES = {
    styles: { font: 'Roboto', fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold', font: 'Roboto' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
};

/**
 * Xuất báo cáo điểm danh ra PDF
 */
export function exportAttendancePDF({ className, fromDate, toDate, students, dates, records }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(16);
    doc.text('BẢNG ĐIỂM DANH HỌC SINH', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('Roboto', 'normal');
    doc.text(`Lớp: ${className}   |   Từ ngày: ${fromDate}   đến ngày: ${toDate}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

    const summaryBody = students.map((s, i) => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const half = studentRecords.filter(r => r.status === 'half').length;
        const total = studentRecords.length || 1;
        const rate = Math.round(((present + late * 0.75 + half * 0.5) / total) * 100);
        return [i + 1, s.name, present, absent, late, half, `${rate}%`];
    });

    autoTable(doc, {
        startY: 34,
        head: [['STT', 'Học sinh', 'Có mặt', 'Vắng', 'Muộn', 'Nửa buổi', 'Tỷ lệ (%)']],
        body: summaryBody,
        ...TABLE_STYLES,
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center', fontStyle: 'bold' },
        },
    });

    if (dates.length > 0) {
        doc.addPage();
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(13);
        doc.text('CHI TIẾT ĐIỂM DANH TỪNG NGÀY', doc.internal.pageSize.width / 2, 15, { align: 'center' });

        const detailBody = students.map((s, i) => {
            const row = [i + 1, s.name];
            dates.forEach(date => {
                const rec = records.find(r => r.studentId === s.id && r.date === date);
                row.push(rec?.status === 'present' ? 'P' : rec?.status === 'absent' ? 'V' : rec?.status === 'late' ? 'M' : rec?.status === 'half' ? '1/2' : '-');
            });
            return row;
        });

        autoTable(doc, {
            startY: 22,
            head: [['STT', 'Học sinh', ...dates.map(d => d.slice(5))]],
            body: detailBody,
            styles: { font: 'Roboto', fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold', font: 'Roboto' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { cellWidth: 40 },
            },
            didParseCell(data) {
                if (data.section === 'body' && data.column.index >= 2) {
                    const val = data.cell.raw;
                    if (val === 'P') data.cell.styles.textColor = [22, 163, 74];
                    else if (val === 'V') data.cell.styles.textColor = [220, 38, 38];
                    else if (val === 'M') data.cell.styles.textColor = [234, 88, 12];
                    else if (val === '1/2') data.cell.styles.textColor = [99, 102, 241];
                }
            },
        });
    }

    addFooter(doc);
    doc.save(`diemdanh_${className}_${fromDate}_${toDate}.pdf`);
}

/**
 * Xuất danh sách học sinh ra PDF
 * @param {Array} students - danh sách học sinh
 * @param {{ showClassCol?: boolean, className?: string }} options
 */
export function exportStudentListPDF(students, { showClassCol = true, className = '' } = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('DANH SÁCH HỌC SINH', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    const subLines = [];
    if (className) subLines.push(`Lớp: ${className}`);
    subLines.push(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`);
    doc.text(subLines.join('   |   '), doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const head = showClassCol
        ? [['STT', 'Mã HS', 'Họ tên', 'Lớp', 'Giới tính', 'Ngày sinh', 'SĐT']]
        : [['STT', 'Mã HS', 'Họ tên', 'Giới tính', 'Ngày sinh', 'SĐT']];

    const body = students.map((s, i) => showClassCol
        ? [i + 1, s.id, s.name, s.classId || '—', s.gender, s.dob, s.phone]
        : [i + 1, s.id, s.name, s.gender, s.dob, s.phone]
    );

    autoTable(doc, {
        startY: 28,
        head,
        body,
        ...TABLE_STYLES,
        columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
    });

    addFooter(doc);
    const fileSuffix = className ? `_${className.replace(/\s+/g, '_')}` : '';
    doc.save(`danh_sach_hoc_sinh${fileSuffix}.pdf`);
}

/**
 * Xuất báo cáo điểm danh nhanh trong ngày
 */
export function exportDailyAttendancePDF({ className, date, students, attendanceMap }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('BÁO CÁO ĐIỂM DANH NGÀY', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(`Lớp: ${className}   |   Ngày: ${date}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    autoTable(doc, {
        startY: 28,
        head: [['STT', 'Mã HS', 'Họ tên', 'Trạng thái']],
        body: students.map((s, i) => [i + 1, s.id, s.name, STATUS_LABEL[attendanceMap[s.id]] || 'Chưa xác định']),
        ...TABLE_STYLES,
        columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 3) {
                const val = data.cell.raw;
                if (val === 'Có mặt') data.cell.styles.textColor = [22, 163, 74];
                else if (val === 'Vắng') data.cell.styles.textColor = [220, 38, 38];
                else if (val === 'Muộn') data.cell.styles.textColor = [234, 88, 12];
                else if (val === 'Nửa buổi') data.cell.styles.textColor = [99, 102, 241];
            }
        }
    });

    addFooter(doc);
    doc.save(`diemdanh_ngay_${className}_${date}.pdf`);
}

/**
 * Xuất báo cáo tổng hợp học kỳ
 */
export function exportSemesterReportPDF({ className, semesterName, totalSessions, students, records, summary }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('BÁO CÁO TỔNG HỢP HỌC KỲ', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const parts = [`Lớp: ${className}`];
    if (semesterName) parts.push(semesterName);
    if (totalSessions) parts.push(`Tổng số buổi: ${totalSessions}`);
    doc.text(parts.join('   |   '), doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

    // Use pre-computed summary if available, otherwise compute from raw records
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

    const tableBody = rows.map((s, i) => [
        i + 1, s.id, s.name, s.present, s.absent, s.late, s.half, `${s.rate}%`,
        s.rate >= 100 ? 'CHUYÊN CẦN' : s.rate < 70 ? 'CẤM THI' : s.rate < 80 ? 'CẢNH BÁO' : 'ĐẠT'
    ]);

    autoTable(doc, {
        startY: 34,
        head: [['STT', 'Mã HS', 'Họ tên', 'Có mặt', 'Vắng', 'Muộn', 'Nửa buổi', 'Tỉ lệ', 'KQ']],
        body: tableBody,
        ...TABLE_STYLES,
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center', fontStyle: 'bold' },
            8: { halign: 'center', fontStyle: 'bold' },
        },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 8) {
                const val = data.cell.raw;
                if (val === 'CHUYÊN CẦN') data.cell.styles.textColor = [13, 148, 136];
                else if (val === 'CẤM THI') data.cell.styles.textColor = [220, 38, 38];
                else if (val === 'CẢNH BÁO') data.cell.styles.textColor = [234, 88, 12];
                else data.cell.styles.textColor = [22, 163, 74];
            }
            if (data.section === 'body' && data.column.index === 7) {
                const rate = parseInt(data.cell.raw);
                if (rate >= 100) data.cell.styles.textColor = [13, 148, 136];
                else if (rate < 70) data.cell.styles.textColor = [220, 38, 38];
                else if (rate < 80) data.cell.styles.textColor = [234, 88, 12];
                else data.cell.styles.textColor = [22, 163, 74];
            }
        }
    });

    addFooter(doc);
    doc.save(`tonghop_hocky_${className}.pdf`);
}
