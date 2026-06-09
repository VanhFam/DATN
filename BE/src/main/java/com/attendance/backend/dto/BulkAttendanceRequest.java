package com.attendance.backend.dto;

import java.util.Map;

public class BulkAttendanceRequest {
    /** Ngày điểm danh */
    private String date;
    /** Lớp */
    private String classId;
    /** ID lịch học (nếu có) */
    private String scheduleId;
    /** Map: studentId -> status (present/absent/late) */
    private Map<String, String> attendanceMap;

    public BulkAttendanceRequest() {
    }

    public BulkAttendanceRequest(String date, String classId, String scheduleId, Map<String, String> attendanceMap) {
        this.date = date;
        this.classId = classId;
        this.scheduleId = scheduleId;
        this.attendanceMap = attendanceMap;
    }

    public static BulkAttendanceRequestBuilder builder() {
        return new BulkAttendanceRequestBuilder();
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Map<String, String> getAttendanceMap() {
        return attendanceMap;
    }

    public void setAttendanceMap(Map<String, String> attendanceMap) {
        this.attendanceMap = attendanceMap;
    }

    public static class BulkAttendanceRequestBuilder {
        private String date;
        private String classId;
        private String scheduleId;
        private Map<String, String> attendanceMap;

        BulkAttendanceRequestBuilder() {
        }

        public BulkAttendanceRequestBuilder date(String date) {
            this.date = date;
            return this;
        }

        public BulkAttendanceRequestBuilder classId(String classId) {
            this.classId = classId;
            return this;
        }

        public BulkAttendanceRequestBuilder scheduleId(String scheduleId) {
            this.scheduleId = scheduleId;
            return this;
        }

        public BulkAttendanceRequestBuilder attendanceMap(Map<String, String> attendanceMap) {
            this.attendanceMap = attendanceMap;
            return this;
        }

        public BulkAttendanceRequest build() {
            return new BulkAttendanceRequest(date, classId, scheduleId, attendanceMap);
        }
    }
}
