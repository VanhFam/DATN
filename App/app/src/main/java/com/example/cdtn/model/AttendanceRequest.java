package com.example.cdtn.model;

public class AttendanceRequest {

    private String base64;
    private String scheduleId;
    private Double lat;
    private Double lng;

    public AttendanceRequest(String base64, String scheduleId, Double lat, Double lng) {
        this.base64 = base64;
        this.scheduleId = scheduleId;
        this.lat = lat;
        this.lng = lng;
    }

    public String getBase64() { return base64; }
    public void setBase64(String base64) { this.base64 = base64; }

    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
}