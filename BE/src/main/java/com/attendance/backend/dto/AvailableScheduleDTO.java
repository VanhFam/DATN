package com.attendance.backend.dto;

public class AvailableScheduleDTO {
    private String scheduleId;
    private String classId;
    private String subject;
    private String timeRange;
    private boolean alreadyAttended;

    public AvailableScheduleDTO() {
    }

    public AvailableScheduleDTO(String scheduleId, String classId, String subject, String timeRange) {
        this.scheduleId = scheduleId;
        this.classId = classId;
        this.subject = subject;
        this.timeRange = timeRange;
        this.alreadyAttended = false;
    }

    public AvailableScheduleDTO(String scheduleId, String classId, String subject, String timeRange, boolean alreadyAttended) {
        this.scheduleId = scheduleId;
        this.classId = classId;
        this.subject = subject;
        this.timeRange = timeRange;
        this.alreadyAttended = alreadyAttended;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getTimeRange() {
        return timeRange;
    }

    public void setTimeRange(String timeRange) {
        this.timeRange = timeRange;
    }

    public boolean isAlreadyAttended() {
        return alreadyAttended;
    }

    public void setAlreadyAttended(boolean alreadyAttended) {
        this.alreadyAttended = alreadyAttended;
    }
}
