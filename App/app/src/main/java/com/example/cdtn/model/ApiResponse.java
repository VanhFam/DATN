package com.example.cdtn.model;

public class ApiResponse<T> {

    private String message;
    private String status;
    private String error;
    private T data;
    private MetaData metaData;

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public T getData() {
        return data;
    }

    public MetaData getMetaData() {
        return metaData;
    }
}