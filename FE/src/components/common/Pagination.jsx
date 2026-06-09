import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../hooks/usePagination';

export function Pagination({
    page,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    onPageChange,
    onPageSizeChange,
}) {
    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white text-sm">
            <div className="flex items-center gap-2 text-gray-500">
                <span>Hiển thị</span>
                <select
                    className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={pageSize}
                    onChange={e => onPageSizeChange(e.target.value)}
                >
                    {PAGE_SIZE_OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
                <span>
                    dòng: {startItem}-{endItem} / {totalItems}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    title="Trang trước"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="min-w-20 text-center text-gray-600 font-semibold">
                    {page} / {totalPages}
                </span>
                <button
                    type="button"
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    title="Trang sau"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
