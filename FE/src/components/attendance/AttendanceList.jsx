export function AttendanceList({ data }) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow">
            <h3 className="font-semibold mb-4">Danh sách</h3>
            {data.map((s, i) => (
                <div key={i} className="flex justify-between">
                    {s.name}
                    <span className={s.status === 'present' ? 'text-green-500' : 'text-red-500'}>
                        {s.status === 'present' ? '✔' : '✖'}
                    </span>
                </div>
            ))}
        </div>
    );
}
