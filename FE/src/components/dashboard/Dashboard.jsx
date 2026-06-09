import { StatCard } from './StatCard';

export function Dashboard() {
    return (
        <div className="grid grid-cols-4 gap-6">
            <StatCard title="Tổng HS" value={40} />
            <StatCard title="Có mặt" value={35} />
            <StatCard title="Vắng" value={3} />
            <StatCard title="Muộn" value={2} />
        </div>
    );
}
