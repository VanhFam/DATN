package com.attendance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "attendance_records",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "date", "class_id", "schedule_id"}))
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", length = 20)
    private String studentId;

    @Column(nullable = false, length = 100)
    private String studentName;

    @Column(name = "class_id", length = 20)
    private String classId;

    @Column(name = "schedule_id", length = 20)
    private String scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", referencedColumnName = "id", insertable = false, updatable = false)
    private ClassRoom classRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Schedule schedule;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AttendanceStatus status;

    /** Giờ điểm danh thực tế */
    private LocalTime checkInTime;

    /** Ghi chú (lý do vắng, muộn...) */
    @Column(length = 500)
    private String note;

    /** Phương thức điểm danh */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Method method = Method.MANUAL;

    public AttendanceRecord() {
    }

    public AttendanceRecord(Long id, String studentId, String studentName, String classId, LocalDate date, AttendanceStatus status, LocalTime checkInTime, String scheduleId, String note, Method method) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.classId = classId;
        this.date = date;
        this.status = status;
        this.checkInTime = checkInTime;
        this.scheduleId = scheduleId;
        this.note = note;
        this.method = method;
    }

    public static AttendanceRecordBuilder builder() {
        return new AttendanceRecordBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Method getMethod() {
        return method;
    }

    public void setMethod(Method method) {
        this.method = method;
    }

    public enum AttendanceStatus {
        present, absent, late
    }

    public enum Method {
        MANUAL, FACE_ID, GPS, QR_CODE
    }

    public static class AttendanceRecordBuilder {
        private Long id;
        private String studentId;
        private String studentName;
        private String classId;
        private LocalDate date;
        private AttendanceStatus status;
        private LocalTime checkInTime;
        private String scheduleId;
        private String note;
        private Method method = Method.MANUAL;

        AttendanceRecordBuilder() {
        }

        public AttendanceRecordBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AttendanceRecordBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public AttendanceRecordBuilder studentName(String studentName) {
            this.studentName = studentName;
            return this;
        }

        public AttendanceRecordBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public AttendanceRecordBuilder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public AttendanceRecordBuilder status(AttendanceStatus status) {
            this.status = status;
            return this;
        }

        public AttendanceRecordBuilder checkInTime(LocalTime checkInTime) {
            this.checkInTime = checkInTime;
            return this;
        }

        public AttendanceRecordBuilder scheduleId(String scheduleId) {
            this.scheduleId = scheduleId;
            return this;
        }

        public AttendanceRecordBuilder note(String note) {
            this.note = note;
            return this;
        }

        public AttendanceRecordBuilder method(Method method) {
            this.method = method;
            return this;
        }

        public AttendanceRecord build() {
            return new AttendanceRecord(id, studentId, studentName, classId, date, status, checkInTime, scheduleId, note, method);
        }
    }
}
