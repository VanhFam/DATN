const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
            headers: { ...getAuthHeader() },
        });
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            let msg = 'Lỗi tải dữ liệu';
            try { if (text) msg = JSON.parse(text).message || msg; } catch (e) { }
            throw new Error(msg);
        }
        return text ? JSON.parse(text) : null;
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            let msg = 'Lỗi gửi dữ liệu';
            try { if (text) msg = JSON.parse(text).message || msg; } catch (e) { }
            throw new Error(msg);
        }
        return text ? JSON.parse(text) : null;
    },

    put: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            let msg = 'Lỗi cập nhật dữ liệu';
            try { if (text) msg = JSON.parse(text).message || msg; } catch (e) { }
            throw new Error(msg);
        }
        return text ? JSON.parse(text) : null;
    },

    delete: async (endpoint) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() },
        });
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            let msg = 'Lỗi xóa dữ liệu';
            try { if (text) msg = JSON.parse(text).message || msg; } catch (e) { }
            throw new Error(msg);
        }
        return text ? JSON.parse(text) : null;
    },

    patch: async (endpoint, data) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: data ? JSON.stringify(data) : undefined,
        });
        const text = await response.text().catch(() => '');
        if (!response.ok) {
            let msg = 'Lỗi cập nhật dữ liệu';
            try { if (text) msg = JSON.parse(text).message || msg; } catch (e) { }
            throw new Error(msg);
        }
        return text ? JSON.parse(text) : null;
    }
};
