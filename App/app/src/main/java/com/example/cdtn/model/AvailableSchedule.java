package com.example.cdtn.model;

public class AvailableSchedule {
    private String scheduleId;
    private String classId;
    private String subject;
    private String timeRange;
    private boolean alreadyAttended;

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

    // Ghi đè phương thức toString để hiển thị trên Spinner (Dropdown)
    @Override
    public String toString() {
        return subject + " (" + timeRange + ") - Lớp " + classId;
    }
}
