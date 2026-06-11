package com.attendance.backend.controller;

import com.attendance.backend.dto.AttendanceRecordDTO;
import com.attendance.backend.entity.AttendanceRecord;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private ClassRoomRepository classRoomRepository;
    @Autowired
    private AttendanceRecordRepository attendanceRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private TeacherRepository teacherRepository;

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getStats(org.springframework.security.core.Authentication authentication) {
        LocalDate today = LocalDate.now();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        String currentTeacherId = isAdmin ? null : resolveTeacherId(authentication);
        
        Map<String, Object> stats = new HashMap<>();
        
        String todayDayOfWeek = getVietnameseDayOfWeek(today.getDayOfWeek().getValue());
        List<Schedule> todaySchedules = isAdmin
                ? scheduleRepository.findAll().stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(todayDayOfWeek))
                        .toList()
                : scheduleRepository.findByTeacherIdIgnoreCase(currentTeacherId).stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(todayDayOfWeek))
                        .toList();
        List<String> todayScheduleIds = todaySchedules.stream().map(Schedule::getId).toList();
        long todayTargetStudents = countAttendanceSlots(todaySchedules);

        if (isAdmin) {
            // Admin: thống kê toàn hệ thống, nhưng số liệu "hôm nay" chỉ tính các lịch đúng thứ trong ngày.
            stats.put("totalStudents", studentRepository.count());
            stats.put("totalClasses", classRoomRepository.count());

            long present = todayScheduleIds.isEmpty() ? 0L
                    : attendanceRepository.countByDateAndScheduleIdsAndStatus(today, todayScheduleIds, AttendanceRecord.AttendanceStatus.present);
            long late = todayScheduleIds.isEmpty() ? 0L
                    : attendanceRepository.countByDateAndScheduleIdsAndStatus(today, todayScheduleIds, AttendanceRecord.AttendanceStatus.late);
            long half = todayScheduleIds.isEmpty() ? 0L
                    : attendanceRepository.countByDateAndScheduleIdsAndStatus(today, todayScheduleIds, AttendanceRecord.AttendanceStatus.half);
            long absent = todayScheduleIds.isEmpty() ? 0L
                    : attendanceRepository.countByDateAndScheduleIdsAndStatus(today, todayScheduleIds, AttendanceRecord.AttendanceStatus.absent);
            stats.put("todayPresent", present + late + half);
            stats.put("todayAbsent", absent);
            stats.put("todayLate", late);
            stats.put("todayHalf", half);
            stats.put("todayTotal", todayScheduleIds.isEmpty() ? 0L : attendanceRepository.countByDateAndScheduleIds(today, todayScheduleIds));
            stats.put("todayTargetStudents", todayTargetStudents);
        } else {
            // Logic cho Giáo viên: chỉ tính các lớp và buổi dạy được phân công.
            String teacherId = currentTeacherId;
            
            List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .map(com.attendance.backend.entity.Schedule::getClassId)
                    .distinct()
                    .toList();
            
            // Bảo vệ khi classIds rỗng (giáo viên chưa được gán lịch dạy)
            long studentCount = classIds.isEmpty() ? 0L : studentRepository.countByClassIds(classIds);
            
            stats.put("totalStudents", studentCount);
            stats.put("totalClasses", classIds.size());
            
            long present = 0, absent = 0, late = 0, half = 0, total = 0;
            for (Schedule schedule : todaySchedules) {
                List<AttendanceRecord> daily = attendanceRepository.findValidRecordsByClassAndDateAndScheduleIds(
                        schedule.getClassId(), today, List.of(schedule.getId()));
                present += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.present).count();
                absent  += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.absent).count();
                late    += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.late).count();
                half    += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.half).count();
                total   += daily.size();
            }
            
            stats.put("todayPresent", present + late + half);
            stats.put("todayAbsent", absent);
            stats.put("todayLate", late);
            stats.put("todayHalf", half);
            stats.put("todayTotal", total);
            stats.put("todayTargetStudents", todayTargetStudents);
        }
        
        // Weekly Data - Chỉ hiển thị những ngày có lịch dạy
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayOfWeekStr = getVietnameseDayOfWeek(date.getDayOfWeek().getValue());
            
            // Kiểm tra xem ngày này có lịch dạy nào không
            List<Schedule> schedulesForDay;
            if (isAdmin) {
                schedulesForDay = scheduleRepository.findAll().stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                        .toList();
            } else {
                schedulesForDay = scheduleRepository.findByTeacherIdIgnoreCase(currentTeacherId).stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                        .toList();
            }

            // Nếu không có lịch dạy vào ngày này, bỏ qua không hiển thị trên biểu đồ
            if (schedulesForDay.isEmpty()) continue;

            long dayTotal = 0;
            double dayPresent = 0.0;
            if (isAdmin) {
                List<String> scheduleIds = schedulesForDay.stream().map(Schedule::getId).toList();
                dayTotal = attendanceRepository.countByDateAndScheduleIds(date, scheduleIds);
                dayPresent = attendanceRepository.countByDateAndScheduleIdsAndStatus(date, scheduleIds, AttendanceRecord.AttendanceStatus.present)
                                + attendanceRepository.countByDateAndScheduleIdsAndStatus(date, scheduleIds, AttendanceRecord.AttendanceStatus.late) * 0.75
                                + attendanceRepository.countByDateAndScheduleIdsAndStatus(date, scheduleIds, AttendanceRecord.AttendanceStatus.half) * 0.5;
            } else {
                for (Schedule schedule : schedulesForDay) {
                    List<AttendanceRecord> daily = attendanceRepository.findValidRecordsByClassAndDateAndScheduleIds(
                            schedule.getClassId(), date, List.of(schedule.getId()));
                    dayTotal += daily.size();
                    dayPresent += daily.stream().mapToDouble(r -> {
                        if (r.getStatus() == AttendanceRecord.AttendanceStatus.present) return 1.0;
                        if (r.getStatus() == AttendanceRecord.AttendanceStatus.late) return 0.75;
                        if (r.getStatus() == AttendanceRecord.AttendanceStatus.half) return 0.5;
                        return 0.0;
                    }).sum();
                }
            }
            
            int rate = dayTotal > 0 ? (int) Math.round((dayPresent / dayTotal) * 100) : 0;
            
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", date.toString());
            dayMap.put("label", dayOfWeekStr + " " + date.format(DateTimeFormatter.ofPattern("dd/MM")));
            dayMap.put("rate", rate);
            weeklyData.add(dayMap);
        }
        stats.put("weeklyStats", weeklyData);
        
        // Recent Activities
        List<AttendanceRecord> recent;
        if (isAdmin) {
            recent = todayScheduleIds.isEmpty()
                    ? new ArrayList<>()
                    : attendanceRepository.findTopByDateAndScheduleIdsOrderByCheckInTimeDesc(today, todayScheduleIds, PageRequest.of(0, 10));
        } else {
            if (todayScheduleIds.isEmpty()) {
                recent = new ArrayList<>();
            } else {
                recent = attendanceRepository.findTopByDateAndScheduleIdsOrderByCheckInTimeDesc(today, todayScheduleIds, PageRequest.of(0, 10));
            }
        }
        
        stats.put("recentActivities", recent.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("studentName", r.getStudentName());
            map.put("classId", r.getClassId());
            map.put("status", r.getStatus().name());
            map.put("time", r.getCheckInTime() != null ? r.getCheckInTime().toString() : "--:--");
            return map;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(stats);
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

    private String resolveTeacherId(org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        boolean hasByUsername = !scheduleRepository.findByTeacherIdIgnoreCase(username).isEmpty();
        if (hasByUsername) return username;
        return teacherRepository.findByUsernameOrId(username)
                .map(com.attendance.backend.entity.Teacher::getId)
                .orElse(username);
    }

    private long countAttendanceSlots(List<Schedule> schedules) {
        return schedules.stream()
                .mapToLong(schedule -> studentRepository.countByClassIdAndIsActive(schedule.getClassId(), true))
                .sum();
    }
}
