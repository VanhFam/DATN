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
            
            stats.put("todayPresent", attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.present));
            stats.put("todayAbsent", attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.absent));
            stats.put("todayLate", attendanceRepository.countByDateAndStatus(today, AttendanceRecord.AttendanceStatus.late));
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
            List<String> scheduledToday = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                    .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                    .map(com.attendance.backend.entity.Schedule::getClassId)
                    .distinct()
                    .toList();

            long present = 0, absent = 0, late = 0, total = 0;
            for (String cid : scheduledToday) {
                List<AttendanceRecord> daily = attendanceRepository.findByClassIdAndDateBetween(cid, today, today);
                present += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.present).count();
                absent  += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.absent).count();
                late    += daily.stream().filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.late).count();
                total   += daily.size();
            }
            
            stats.put("todayPresent", present + late);
            stats.put("todayAbsent", absent);
            stats.put("todayLate", late);
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

            long dayTotal = 0, dayPresent = 0;
            if (isAdmin) {
                dayTotal = attendanceRepository.countByDate(date);
                dayPresent = attendanceRepository.countByDateAndStatus(date, AttendanceRecord.AttendanceStatus.present) 
                                + attendanceRepository.countByDateAndStatus(date, AttendanceRecord.AttendanceStatus.late);
            } else {
                String teacherId = authentication.getName();
                List<String> classIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                        .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                        .map(com.attendance.backend.entity.Schedule::getClassId)
                        .distinct()
                        .toList();
                
                for (String cid : classIds) {
                    List<AttendanceRecord> daily = attendanceRepository.findByClassIdAndDateBetween(cid, date, date);
                    dayTotal += daily.size();
                    dayPresent += daily.stream().filter(r -> r.getStatus() != AttendanceRecord.AttendanceStatus.absent).count();
                }
            }
            
            int rate = dayTotal > 0 ? (int) Math.round(((double) dayPresent / dayTotal) * 100) : 0;
            
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
