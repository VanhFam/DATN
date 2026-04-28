const BASE_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('attendance_user'));
    if (user && user.token) {
        return { 'Authorization': `Bearer ${user.token}` };
    }
    return {};
};

export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                ...getAuthHeader(),
            },
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Lỗi tải dữ liệu' }));
            throw new Error(error.message || 'API Error');
        }
        return response.json();
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Lỗi gửi dữ liệu' }));
            throw new Error(error.message || 'API Error');
        }
        return response.json();
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Lỗi cập nhật dữ liệu' }));
            throw new Error(error.message || 'API Error');
        }
        return response.json();
    },

    delete: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
            },
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Lỗi xóa dữ liệu' }));
            throw new Error(error.message || 'API Error');
        }
        return response.status === 204 ? null : response.json();
    },

    patch: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Lỗi cập nhật dữ liệu' }));
            throw new Error(error.message || 'API Error');
        }
        return response.json();
    }
};
