package com.attendance.backend.service;

import com.attendance.backend.dto.AttendanceSummaryDTO;
import com.attendance.backend.dto.AttendanceRecordDTO;
import com.attendance.backend.dto.BulkAttendanceRequest;
import com.attendance.backend.entity.AttendanceRecord;
import com.attendance.backend.entity.Location;
import com.attendance.backend.entity.Student;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.LocationRepository;
import com.attendance.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("[HH:mm][H:mm]");

    private final AttendanceRecordRepository attendanceRepo;
    private final StudentRepository studentRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;
    private final LocationRepository locationRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRepo,
                            StudentRepository studentRepository,
                            com.attendance.backend.repository.ScheduleRepository scheduleRepository,
                            LocationRepository locationRepository) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepository = studentRepository;
        this.scheduleRepository = scheduleRepository;
        this.locationRepository = locationRepository;
    }

    /** Lấy danh sách điểm danh theo lớp và ngày */
    public List<AttendanceRecordDTO> getByClassAndDate(String classId, LocalDate date) {
        return attendanceRepo.findValidRecordsByClassAndDate(classId, date)
                .stream().map(this::toDTO).toList();
    }

    /** Lấy lịch sử điểm danh của 1 sinh viên trong khoảng ngày */
    public List<AttendanceRecordDTO> getByStudentAndDateRange(String studentId, LocalDate from, LocalDate to) {
        return attendanceRepo.findByStudentIdAndDateBetween(studentId, from, to)
                .stream().map(this::toDTO).toList();
    }

    /** Lấy toàn bộ điểm danh theo lớp trong khoảng ngày */
    public List<AttendanceRecordDTO> getByClassAndDateRange(String classId, LocalDate from, LocalDate to) {
        return attendanceRepo.findValidRecordsByClassAndDateRange(classId, from, to)
                .stream().map(this::toDTO).toList();
    }

    /** Ghi nhận điểm danh hàng loạt cho cả lớp */
    @Transactional
    public List<AttendanceRecordDTO> bulkSave(BulkAttendanceRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        
        // Ràng buộc 1: Chỉ được điểm danh trong ngày hôm nay
        if (!date.equals(LocalDate.now())) {
            throw new RuntimeException("Chỉ được phép điểm danh cho ngày hôm nay (" + LocalDate.now() + ")");
        }

        // Ràng buộc 2: Chỉ được điểm danh vào những ngày có lịch dạy
        String dayOfWeekStr = getVietnameseDayOfWeek(date.getDayOfWeek().getValue());
        List<com.attendance.backend.entity.Schedule> daySchedules = scheduleRepository.findByClassId(request.getClassId()).stream()
                .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                .toList();
        
        if (daySchedules.isEmpty()) {
            throw new RuntimeException("Hôm nay (" + dayOfWeekStr + ") không có lịch dạy cho học phần " + request.getClassId() + ". Không thể điểm danh.");
        }

        // Ràng buộc 3: Chỉ được điểm danh trong khung giờ học (cho phép buffer 30p trước và sau)
        LocalTime now = LocalTime.now();
        logger.info("Checking attendance time for class: {}, day: {}, now: {}", request.getClassId(), dayOfWeekStr, now);

        boolean isWithinTime = daySchedules.stream().anyMatch(s -> {
            try {
                LocalTime start = LocalTime.parse(s.getStartTime(), TIME_FORMATTER).minusMinutes(30);
                LocalTime end = LocalTime.parse(s.getEndTime(), TIME_FORMATTER).plusMinutes(30);
                boolean match = !now.isBefore(start) && !now.isAfter(end);
                logger.info("Schedule: {} - {}, Match: {}", s.getStartTime(), s.getEndTime(), match);
                return match;
            } catch (DateTimeParseException e) {
                logger.error("Failed to parse time for schedule {}: {} - {}", s.getId(), s.getStartTime(), s.getEndTime());
                return false;
            }
        });

        if (!isWithinTime) {
            String timeInfo = daySchedules.stream()
                .map(s -> s.getStartTime() + " - " + s.getEndTime())
                .reduce((a, b) -> a + ", " + b).orElse("");
            logger.warn("Attendance denied: Outside scheduled time. Now: {}, Allowed: {}", now, timeInfo);
            throw new RuntimeException("Hiện tại (" + now.format(DateTimeFormatter.ofPattern("HH:mm")) + ") nằm ngoài khung giờ học của học phần này (" + timeInfo + "). Hệ thống cho phép điểm danh sớm hoặc muộn tối đa 30 phút.");
        }

        List<AttendanceRecord> saved = new ArrayList<>();

        request.getAttendanceMap().forEach((studentId, statusStr) -> {
            AttendanceRecord.AttendanceStatus status =
                    AttendanceRecord.AttendanceStatus.valueOf(statusStr.toLowerCase());

            // Ràng buộc 2: Sinh viên phải thuộc đúng lớp mới được điểm danh
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + studentId));
            
            boolean isInClass = student.getClasses().stream()
                    .anyMatch(c -> c.getId().equals(request.getClassId()));
            
            if (!isInClass) {
                throw new RuntimeException("Sinh viên " + studentId + " không thuộc học phần " + request.getClassId());
            }

            // Upsert: nếu đã có thì cập nhật (dựa trên student, date, class và schedule)
            AttendanceRecord record = attendanceRepo
                    .findByStudentIdAndDateAndClassIdAndScheduleId(studentId, date, request.getClassId(), request.getScheduleId())
                    .orElse(null);

            if (record == null) {
                record = AttendanceRecord.builder()
                        .studentId(studentId)
                        .studentName(student.getName())
                        .classId(request.getClassId())
                        .date(date)
                        .scheduleId(request.getScheduleId())
                        .method(AttendanceRecord.Method.MANUAL)
                        .build();
            }

            record.setStatus(status);
            if (status == AttendanceRecord.AttendanceStatus.present) {
                record.setCheckInTime(LocalTime.now());
            }
            saved.add(attendanceRepo.save(record));
        });

        return saved.stream().map(this::toDTO).toList();
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

    /**
     * Tính khoảng cách giữa 2 tọa độ GPS bằng công thức Haversine.
     * @return khoảng cách tính bằng MÉT
     */
    public double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371000; // Bán kính Trái Đất (mét)
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lng2 - lng1);

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
                + Math.cos(phi1) * Math.cos(phi2)
                * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Kiểm tra GPS học sinh khi điểm danh (từ app mobile).
     * - Lấy danh sách địa điểm trường đang hoạt động
     * - Tính khoảng cách Haversine giữa học sinh và từng địa điểm
     * - Nếu trong bán kính -> HỢP LỆ, nếu không -> TỪ CHỐI
     */
    @Transactional
    public java.util.Map<String, Object> gpsCheckIn(String studentId, String classId, double lat, double lng) {
        // 1. Lấy danh sách địa điểm đang hoạt động
        List<Location> activeLocations = locationRepository.findByIsActive(true);
        if (activeLocations.isEmpty()) {
            throw new RuntimeException("Hệ thống chưa có vị trí điểm danh nào được cấu hình. Vui lòng liên hệ Admin.");
        }

        // 2. Kiểm tra học sinh có trong phạm vi cho phép không
        Location matchedLocation = null;
        double closestDistance = Double.MAX_VALUE;

        for (Location loc : activeLocations) {
            double distance = haversineDistance(lat, lng, loc.getLat(), loc.getLng());
            logger.info("GPS Check: Student={} at ({},{}) vs Location={} at ({},{}) -> Distance={}m, Radius={}m",
                    studentId, lat, lng, loc.getName(), loc.getLat(), loc.getLng(), (int)distance, loc.getRadius());
            if (distance < closestDistance) closestDistance = distance;
            if (distance <= loc.getRadius()) {
                matchedLocation = loc;
                break;
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();

        if (matchedLocation == null) {
            // Ngoài phạm vi -> KHÔNG HỢP LỆ
            result.put("valid", false);
            result.put("distanceMeters", (int) closestDistance);
            result.put("message", String.format(
                "Vị trí của bạn đang cách trường khoảng %dm. Phải ở trong phạm vi %dm để điểm danh.",
                (int) closestDistance, activeLocations.stream().mapToInt(Location::getRadius).max().orElse(200)));
            logger.warn("GPS Check FAILED: Student={}, Distance={}m", studentId, (int)closestDistance);
        } else {
            // Trong phạm vi -> HỢP LỆ
            result.put("valid", true);
            result.put("locationName", matchedLocation.getName());
            result.put("distanceMeters", (int) closestDistance);
            result.put("message", String.format(
                "Vị trí hợp lệ! Bạn đang ở tại %s (cách %dm).",
                matchedLocation.getName(), (int) closestDistance));
            logger.info("GPS Check PASSED: Student={}, Location={}, Distance={}m", studentId, matchedLocation.getName(), (int)closestDistance);
        }

        return result;
    }


    /** Cập nhật 1 bản ghi điểm danh */
    @Transactional
    public AttendanceRecordDTO updateRecord(Long id, AttendanceRecordDTO dto) {
        AttendanceRecord record = attendanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi điểm danh: " + id));

        record.setStatus(AttendanceRecord.AttendanceStatus.valueOf(dto.getStatus().toLowerCase()));
        if (dto.getNote() != null) record.setNote(dto.getNote());
        if (dto.getCheckInTime() != null) {
            record.setCheckInTime(LocalTime.parse(dto.getCheckInTime()));
        }

        return toDTO(attendanceRepo.save(record));
    }

    /** Thống kê tỷ lệ có mặt và mức độ cảnh báo của sinh viên */
    public AttendanceSummaryDTO getAttendanceSummary(String studentId, LocalDate from, LocalDate to) {
        long total = attendanceRepo.countTotalByStudentAndDateRange(studentId, from, to);
        if (total == 0) {
            return new AttendanceSummaryDTO(studentId, 0.0, "NONE", "Chưa có dữ liệu điểm danh");
        }
        
        long present = attendanceRepo.countByStatusAndStudentAndDateRange(studentId, AttendanceRecord.AttendanceStatus.present, from, to);
        double rate = Math.round((double) present / total * 1000.0) / 10.0;
        double absenceRate = 100.0 - rate;
        
        String alertLevel = "NONE";
        String message = "Chuyên cần tốt";
        
        if (absenceRate > 20.0) {
            alertLevel = "RED";
            message = "Cảnh báo Đỏ: Nghỉ quá 20% (" + absenceRate + "%). Nguy cơ cấm thi!";
        } else if (absenceRate > 15.0) {
            alertLevel = "YELLOW";
            message = "Cảnh báo Vàng: Nghỉ quá 15% (" + absenceRate + "%). Cần chú ý chuyên cần.";
        }
        
        return new AttendanceSummaryDTO(studentId, rate, alertLevel, message);
    }

    private AttendanceRecordDTO toDTO(AttendanceRecord r) {
        return AttendanceRecordDTO.builder()
                .id(r.getId())
                .studentId(r.getStudentId())
                .studentName(r.getStudentName())
                .classId(r.getClassId())
                .date(r.getDate())
                .status(r.getStatus().name())
                .checkInTime(r.getCheckInTime() != null
                        ? r.getCheckInTime().format(DateTimeFormatter.ofPattern("HH:mm:ss")) : null)
                .scheduleId(r.getScheduleId())
                .note(r.getNote())
                .method(r.getMethod() != null ? r.getMethod().name() : null)
                .build();
    }
}
