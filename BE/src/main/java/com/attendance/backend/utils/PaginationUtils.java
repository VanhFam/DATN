package com.attendance.backend.utils;

import com.attendance.backend.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

public final class PaginationUtils {
    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 100;

    private PaginationUtils() {
    }

    public static Pageable toPageable(Integer page, Integer limit, Sort sort) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeLimit = limit == null || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        return PageRequest.of(safePage - 1, safeLimit, sort);
    }

    public static <T> PaginatedResponse<T> fromPage(Page<T> page) {
        return new PaginatedResponse<>(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalPages()
        );
    }

    public static <T> PaginatedResponse<T> fromList(List<T> data, long total, Pageable pageable) {
        return new PaginatedResponse<>(
                data,
                total,
                pageable.getPageNumber() + 1,
                pageable.getPageSize(),
                (int) Math.ceil(total / (double) pageable.getPageSize())
        );
    }
}
