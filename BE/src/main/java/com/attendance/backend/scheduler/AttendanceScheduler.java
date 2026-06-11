package com.attendance.backend.scheduler;

import com.attendance.backend.entity.AttendanceRecord;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.entity.Student;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.SemesterRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.utils.TimeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;

@Component
public class AttendanceScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceScheduler.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ScheduleRepository scheduleRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRecordRepository attendanceRepo;
    private final SemesterRepository semesterRepository;

    public AttendanceScheduler(ScheduleRepository scheduleRepository,
                               StudentRepository studentRepository,
                               AttendanceRecordRepository attendanceRepo,
                               SemesterRepository semesterRepository) {
        this.scheduleRepository = scheduleRepository;
        this.studentRepository = studentRepository;
        this.attendanceRepo = attendanceRepo;
        this.semesterRepository = semesterRepository;
    }

    /**
     * Chạy mỗi 5 phút — tự động ghi "Vắng" cho sinh viên chưa điểm danh khi buổi học đã kết thúc.
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void autoMarkAbsent() {
        LocalDate today = LocalDate.now(ZONE);
        LocalTime now = LocalTime.now(ZONE);
        String dayOfWeek = getVietnameseDayOfWeek(today.getDayOfWeek().getValue());
        Long activeSemesterId = semesterRepository.findByIsActiveTrue()
                .map(com.attendance.backend.entity.Semester::getId)
                .orElse(null);

        if (activeSemesterId == null) {
            logger.info("[Scheduler] Chưa có học kỳ hoạt động, bỏ qua tự động ghi vắng.");
            return;
        }

        List<Schedule> endedSchedules = scheduleRepository.findAll().stream()
                .filter(s -> activeSemesterId.equals(s.getSemesterId()))
                .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                .filter(s -> {
                    try {
                        LocalTime end = LocalTime.parse(s.getEndTime(), TimeUtils.TIME_FORMATTER);
                        return now.isAfter(end);
                    } catch (DateTimeParseException e) {
                        logger.warn("[Scheduler] Không parse được endTime của lịch {}: {}", s.getId(), s.getEndTime());
                        return false;
                    }
                })
                .toList();

        if (endedSchedules.isEmpty()) return;

        logger.info("[Scheduler] Tìm thấy {} lịch đã kết thúc hôm nay ({})", endedSchedules.size(), today);

        int count = 0;
        for (Schedule schedule : endedSchedules) {
            List<Student> students = studentRepository.findByClassIdAndIsActive(schedule.getClassId(), true);
            for (Student student : students) {
                boolean alreadyRecorded = attendanceRepo
                        .findByStudentIdAndDateAndClassIdAndScheduleId(
                                student.getId(), today, schedule.getClassId(), schedule.getId())
                        .isPresent();

                if (!alreadyRecorded) {
                    AttendanceRecord record = AttendanceRecord.builder()
                            .studentId(student.getId())
                            .studentName(student.getName())
                            .classId(schedule.getClassId())
                            .date(today)
                            .scheduleId(schedule.getId())
                            .status(AttendanceRecord.AttendanceStatus.absent)
                            .method(AttendanceRecord.Method.MANUAL)
                            .note("Tự động ghi vắng khi hết giờ")
                            .build();
                    attendanceRepo.save(record);
                    count++;
                    logger.debug("[Scheduler] Ghi vắng: SV {} | Lớp {} | Lịch {}",
                            student.getId(), schedule.getClassId(), schedule.getId());
                }
            }
        }

        if (count > 0) {
            logger.info("[Scheduler] Đã tự động ghi vắng cho {} sinh viên.", count);
        }
    }

    private String getVietnameseDayOfWeek(int dayValue) {
        return switch (dayValue) {
            case 1 -> "Thứ 2";
            case 2 -> "Thứ 3";
            case 3 -> "Thứ 4";
            case 4 -> "Thứ 5";
            case 5 -> "Thứ 6";
            case 6 -> "Thứ 7";
            case 7 -> "Chủ Nhật";
            default -> "Thứ 2";
        };
    }
}
