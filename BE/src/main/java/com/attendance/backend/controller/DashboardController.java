package com.attendance.backend.controller;

import com.attendance.backend.dto.AttendanceRecordDTO;
import com.attendance.backend.entity.AttendanceRecord;
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
        
        Map<String, Object> stats = new HashMap<>();
        
        if (isAdmin) {
            // Logic cũ cho Admin - Thống kê toàn hệ thống
            stats.put("totalStudents", studentRepository.count());
            stats.put("totalClasses", classRoomRepository.count());
            
            long present = attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.present);
            long late = attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.late);
            long half = attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.half);
            stats.put("todayPresent", present + late + half);
            stats.put("todayAbsent", attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.absent));
            stats.put("todayLate", late);
            stats.put("todayHalf", half);
            stats.put("todayTotal", attendanceRepository.countByDate(today));
        } else {
            // Logic cho Giáo viên: Username chính là mã giáo viên (GV001)
            String teacherId = authentication.getName();
            
            List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .map(com.attendance.backend.entity.Schedule::getClassId)
                    .distinct()
                    .toList();
            
            // Bảo vệ khi classIds rỗng (giáo viên chưa được gán lịch dạy)
            long studentCount = classIds.isEmpty() ? 0L : studentRepository.countByClassIds(classIds);
            
            stats.put("totalStudents", studentCount);
            stats.put("totalClasses", classIds.size());
            
            // Điểm danh hôm nay của các lớp có lịch dạy hôm nay
            String dayOfWeekStr = getVietnameseDayOfWeek(today.getDayOfWeek().getValue());
            List<com.attendance.backend.entity.Schedule> scheduledToday = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                    .toList();

            long present = 0, absent = 0, late = 0, half = 0, total = 0;
            for (com.attendance.backend.entity.Schedule schedule : scheduledToday) {
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
        }
        
        // Weekly Data - Chỉ hiển thị những ngày có lịch dạy
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayOfWeekStr = getVietnameseDayOfWeek(date.getDayOfWeek().getValue());
            
            // Kiểm tra xem ngày này có lịch dạy nào không
            boolean hasSchedule;
            if (isAdmin) {
                hasSchedule = scheduleRepository.findAll().stream()
                                .anyMatch(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr));
            } else {
                String teacherId = authentication.getName();
                hasSchedule = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                                .anyMatch(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr));
            }

            // Nếu không có lịch dạy vào ngày này, bỏ qua không hiển thị trên biểu đồ
            if (!hasSchedule) continue;

            long dayTotal = 0;
            double dayPresent = 0.0;
            if (isAdmin) {
                dayTotal = attendanceRepository.countByDate(date);
                dayPresent = attendanceRepository.countByDateAndStatus(date, AttendanceRecord.AttendanceStatus.present)
                                + attendanceRepository.countByDateAndStatus(date, AttendanceRecord.AttendanceStatus.late) * 0.75
                                + attendanceRepository.countByDateAndStatus(date, AttendanceRecord.AttendanceStatus.half) * 0.5;
            } else {
                String teacherId = authentication.getName();
                List<com.attendance.backend.entity.Schedule> schedules = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                        .toList();
                
                for (com.attendance.backend.entity.Schedule schedule : schedules) {
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
            recent = attendanceRepository.findTop10ByDateOrderByCheckInTimeDesc(today);
        } else {
            String teacherId = authentication.getName(); // Username chính là mã giáo viên
            
            // Lấy danh sách lớp giáo viên quản lý
            List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .map(com.attendance.backend.entity.Schedule::getClassId)
                    .distinct()
                    .toList();
            
            if (classIds.isEmpty()) {
                recent = new ArrayList<>();
            } else {
                recent = attendanceRepository.findTopByClassIdInAndDateOrderByCheckInTimeDesc(classIds, today, PageRequest.of(0, 10));
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
}
