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

const STATUS_LABEL = {
    present: 'Có mặt',
    absent: 'Vắng',
    late: 'Muộn',
};

/**
 * Xuất báo cáo điểm danh ra PDF
 * @param {object} options
 * @param {string} options.className
 * @param {string} options.fromDate
 * @param {string} options.toDate
 * @param {Array} options.students
 * @param {Array} options.dates
 * @param {Array} options.records
 */
export function exportAttendancePDF({ className, fromDate, toDate, students, dates, records }) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    setupFonts(doc);

    // Tiêu đề
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(16);
    doc.text('BANG DIEM DANH HOC SINH', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('Roboto', 'normal');
    doc.text(`Lop: ${className}   |   Tu ngay: ${fromDate}   den ngay: ${toDate}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });

    // Bảng tổng hợp
    const summaryHead = [['STT', 'Học sinh', 'Có mặt', 'Vắng', 'Muộn', 'Tỷ lệ (%)']];
    const summaryBody = students.map((s, i) => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const total = studentRecords.length || 1;
        const rate = Math.round(((present + late) / total) * 100);
        return [i + 1, s.name, present, absent, late, `${rate}%`];
    });

    autoTable(doc, {
        startY: 34,
        head: summaryHead,
        body: summaryBody,
        styles: { font: 'Roboto', fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 255] },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center', fontStyle: 'bold' },
        },
    });

    // Thêm trang chi tiết từng ngày nếu có nhiều ngày
    if (dates.length > 0) {
        doc.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('CHI TIẾT ĐIỂM DANH TỪNG NGÀY', doc.internal.pageSize.width / 2, 15, { align: 'center' });

        const detailHead = [['STT', 'Học sinh', ...dates.map(d => d.slice(5))]]; // MM-DD
        const detailBody = students.map((s, i) => {
            const row = [i + 1, s.name];
            dates.forEach(date => {
                const rec = records.find(r => r.studentId === s.id && r.date === date);
                const symbol = rec?.status === 'present' ? 'P' : rec?.status === 'absent' ? 'V' : rec?.status === 'late' ? 'M' : '-';
                row.push(symbol);
            });
            return row;
        });

        autoTable(doc, {
            startY: 22,
            head: detailHead,
            body: detailBody,
            styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.5 },
            headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
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
                }
            },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text(`Trang ${i}/${pageCount}  |  Attendance AI - Hệ thống quản lý điểm danh`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
    }

    doc.save(`diemdanh_${className}_${fromDate}_${toDate}.pdf`);
}

/**
 * Xuất danh sách học sinh ra PDF
 */
export function exportStudentListPDF(students) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('DANH SACH HOC SINH', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    autoTable(doc, {
        startY: 28,
        head: [['STT', 'Mã HS', 'Họ tên', 'Lớp', 'Giới tính', 'Ngày sinh', 'SĐT']],
        body: students.map((s, i) => [i + 1, s.id, s.name, s.class, s.gender, s.dob, s.phone]),
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Trang ${i}/${pageCount}  |  Attendance AI`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: 'center' });
    }

    doc.save(`danh_sach_hoc_sinh.pdf`);
}

/**
 * Xuất báo cáo điểm danh nhanh trong ngày
 */
export function exportDailyAttendancePDF({ className, date, students, attendanceMap }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('BAO CAO DIEM DANH NGAY', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(`Lop: ${className}   |   Ngay: ${date}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const tableBody = students.map((s, i) => [
        i + 1,
        s.id,
        s.name,
        STATUS_LABEL[attendanceMap[s.id]] || 'Chua xac dinh'
    ]);

    autoTable(doc, {
        startY: 28,
        head: [['STT', 'Ma HS', 'Ho ten', 'Trang thai']],
        body: tableBody,
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 3) {
                const val = data.cell.raw;
                if (val === 'Co mat') data.cell.styles.textColor = [22, 163, 74];
                else if (val === 'Vang') data.cell.styles.textColor = [220, 38, 38];
                else if (val === 'Muon') data.cell.styles.textColor = [234, 88, 12];
            }
        }
    });

    doc.save(`diemdanh_ngay_${className}_${date}.pdf`);
}

/**
 * Xuất báo cáo tổng hợp học kỳ (tỷ lệ vắng %)
 */
export function exportSemesterReportPDF({ className, students, records }) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    setupFonts(doc);

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(14);
    doc.text('BAO CAO TONG HOP HOC KY', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(`Lop: ${className}   |   Hoc ky: 2 (2025-2026)`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

    const tableBody = students.map((s, i) => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const total = studentRecords.length || 1;
        const absentRate = Math.round((absent / total) * 100);

        return [
            i + 1,
            s.id,
            s.name,
            total,
            present,
            absent,
            late,
            `${absentRate}%`
        ];
    });

    autoTable(doc, {
        startY: 28,
        head: [['STT', 'Ma HS', 'Ho ten', 'Tong buoi', 'Co mat', 'Vang', 'Muon', '% Vang']],
        body: tableBody,
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        columnStyles: {
            7: { fontStyle: 'bold', halign: 'center' }
        },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 7) {
                const val = parseInt(data.cell.raw);
                if (val > 20) data.cell.styles.textColor = [220, 38, 38]; // Canh bao neu vang > 20%
            }
        }
    });

    doc.save(`tonghop_hocky_${className}.pdf`);
}
