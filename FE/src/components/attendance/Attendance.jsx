import { CameraBox } from './CameraBox';
import { AttendanceList } from './AttendanceList';

export function Attendance() {
    const data = [
        { name: 'Nguyễn Văn A', status: 'present' },
        { name: 'Trần B', status: 'absent' },
    ];

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8"><CameraBox /></div>
            <div className="col-span-4"><AttendanceList data={data} /></div>
        </div>
    );
}
