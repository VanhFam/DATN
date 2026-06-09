export const buildPaginatedEndpoint = (endpoint, { page = 1, limit = 10, search = '', extra = {} } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);

    Object.entries(extra).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
        }
    });

    return `${endpoint}?${params.toString()}`;
};

export const normalizePaginatedResponse = (response) => {
    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
            page: 1,
            limit: response.length,
            totalPages: 1,
            serverPaginated: false,
        };
    }

    const data = response?.data || response?.items || response?.content || [];
    const total = response?.total ?? response?.totalItems ?? response?.totalElements ?? data.length;
    const page = response?.page ?? response?.currentPage ?? 1;
    const limit = response?.limit ?? response?.pageSize ?? data.length;

    return {
        data,
        total,
        page,
        limit,
        totalPages: response?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))),
        serverPaginated: true,
    };
};
