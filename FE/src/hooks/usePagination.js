import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function usePagination(items, { initialPageSize = 10, resetKeys = [] } = {}) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    useEffect(() => {
        setPage(1);
    }, resetKeys);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    const changePageSize = (value) => {
        setPageSize(Number(value));
        setPage(1);
    };

    return {
        page,
        pageSize,
        totalItems,
        totalPages,
        pageItems,
        setPage,
        setPageSize: changePageSize,
        startItem: totalItems === 0 ? 0 : (page - 1) * pageSize + 1,
        endItem: Math.min(page * pageSize, totalItems),
    };
}
