package com.attendance.backend.dto;

import java.time.LocalDate;

public class AttendanceRecordDTO {
    private Long id;
    private String studentId;
    private String studentName;
    private String classId;
    private LocalDate date;
    private String status;     // present | absent | late
    private String checkInTime;
    private String scheduleId;
    private String note;
    private String method;

    public AttendanceRecordDTO() {
    }

    public AttendanceRecordDTO(Long id, String studentId, String studentName, String classId, LocalDate date, String status, String checkInTime, String scheduleId, String note, String method) {
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

    public static AttendanceRecordDTOBuilder builder() {
        return new AttendanceRecordDTOBuilder();
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(String checkInTime) {
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

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public static class AttendanceRecordDTOBuilder {
        private Long id;
        private String studentId;
        private String studentName;
        private String classId;
        private LocalDate date;
        private String status;
        private String checkInTime;
        private String scheduleId;
        private String note;
        private String method;

        AttendanceRecordDTOBuilder() {
        }

        public AttendanceRecordDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AttendanceRecordDTOBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public AttendanceRecordDTOBuilder studentName(String studentName) {
            this.studentName = studentName;
            return this;
        }

        public AttendanceRecordDTOBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public AttendanceRecordDTOBuilder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public AttendanceRecordDTOBuilder status(String status) {
            this.status = status;
            return this;
        }

        public AttendanceRecordDTOBuilder checkInTime(String checkInTime) {
            this.checkInTime = checkInTime;
            return this;
        }

        public AttendanceRecordDTOBuilder scheduleId(String scheduleId) {
            this.scheduleId = scheduleId;
            return this;
        }

        public AttendanceRecordDTOBuilder note(String note) {
            this.note = note;
            return this;
        }

        public AttendanceRecordDTOBuilder method(String method) {
            this.method = method;
            return this;
        }

        public AttendanceRecordDTO build() {
            return new AttendanceRecordDTO(id, studentId, studentName, classId, date, status, checkInTime, scheduleId, note, method);
        }
    }
}
