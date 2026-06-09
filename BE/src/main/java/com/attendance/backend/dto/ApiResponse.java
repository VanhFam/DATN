package com.attendance.backend.dto;

public class ApiResponse<T> {
    private String message;
    private String status;
    private String error;
    private T data;
    private MetaData metaData;

    public ApiResponse() {}

    public ApiResponse(String message, String status, String error, T data) {
        this.message = message;
        this.status = status;
        this.error = error;
        this.data = data;
    }

    public ApiResponse(String message, String status, String error, T data, MetaData metaData) {
        this.message = message;
        this.status = status;
        this.error = error;
        this.data = data;
        this.metaData = metaData;
    }

    // Getters and setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    
    public MetaData getMetaData() { return metaData; }
    public void setMetaData(MetaData metaData) { this.metaData = metaData; }
    
    public static class MetaData {
        private int currentPage;
        private int totalPages;
        
        public MetaData() {}
        public MetaData(int currentPage, int totalPages) {
            this.currentPage = currentPage;
            this.totalPages = totalPages;
        }
        public int getCurrentPage() { return currentPage; }
        public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    }
}
