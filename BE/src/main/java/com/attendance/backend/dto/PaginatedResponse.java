package com.attendance.backend.dto;

import java.util.List;

public class PaginatedResponse<T> {
    private List<T> data;
    private long total;
    private int page;
    private int limit;
    private int totalPages;

    public PaginatedResponse() {
    }

    public PaginatedResponse(List<T> data, long total, int page, int limit, int totalPages) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = totalPages;
    }

    public List<T> getData() {
        return data;
    }

    public void setData(List<T> data) {
        this.data = data;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
