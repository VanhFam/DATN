package com.attendance.backend.service;

import com.attendance.backend.dto.AttendanceSummaryDTO;
import com.attendance.backend.dto.AttendanceRecordDTO;
import com.attendance.backend.dto.BulkAttendanceRequest;
import com.attendance.backend.entity.AttendanceRecord;
import com.attendance.backend.entity.Student;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.attendance.backend.utils.TimeUtils;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);
    private static final DateTimeFormatter TIME_FORMATTER = TimeUtils.TIME_FORMATTER;

    private final AttendanceRecordRepository attendanceRepo;
    private final StudentRepository studentRepository;
    private final com.attendance.backend.repository.ScheduleRepository scheduleRepository;
    private final com.attendance.backend.repository.LocationRepository locationRepository;
    private final FaceRecognitionService faceRecognitionService;
    private final com.attendance.backend.repository.SemesterRepository semesterRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRepo,
                            StudentRepository studentRepository,
                            com.attendance.backend.repository.ScheduleRepository scheduleRepository,
                            com.attendance.backend.repository.LocationRepository locationRepository,
                            FaceRecognitionService faceRecognitionService,
                            com.attendance.backend.repository.SemesterRepository semesterRepository) {
        this.attendanceRepo = attendanceRepo;
        this.studentRepository = studentRepository;
        this.scheduleRepository = scheduleRepository;
        this.locationRepository = locationRepository;
        this.faceRecognitionService = faceRecognitionService;
        this.semesterRepository = semesterRepository;
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

    /** Lấy toàn bộ điểm danh theo lớp trong khoảng ngày (Admin: tất cả giáo viên) */
    @Transactional
    public List<AttendanceRecordDTO> getByClassAndDateRange(String classId, LocalDate from, LocalDate to) {
        backfillMissingScheduleIds(classId, from, to);
        return attendanceRepo.findValidRecordsByClassAndDateRange(classId, from, to)
                .stream().map(this::toDTO).toList();
    }

    /** Lấy điểm danh theo lớp trong khoảng ngày, chỉ lấy buổi do teacherId dạy */
    @Transactional
    public List<AttendanceRecordDTO> getByClassAndDateRangeForTeacher(String classId, LocalDate from, LocalDate to, String teacherId) {
        backfillMissingScheduleIds(classId, from, to);
        List<String> scheduleIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                .filter(s -> s.getClassId().equalsIgnoreCase(classId))
                .map(com.attendance.backend.entity.Schedule::getId)
                .toList();
        if (scheduleIds.isEmpty()) return List.of();
        return attendanceRepo.findByClassAndDateRangeAndScheduleIds(classId, from, to, scheduleIds)
                .stream().map(this::toDTO).toList();
    }

    /** Lấy điểm danh theo lớp và ngày, chỉ lấy buổi do teacherId dạy */
    @Transactional
    public List<AttendanceRecordDTO> getByClassAndDateForTeacher(String classId, LocalDate date, String teacherId) {
        backfillMissingScheduleIds(classId, date, date);
        List<String> scheduleIds = scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                .filter(s -> s.getClassId().equalsIgnoreCase(classId))
                .map(com.attendance.backend.entity.Schedule::getId)
                .toList();
        if (scheduleIds.isEmpty()) return List.of();
        return attendanceRepo.findValidRecordsByClassAndDateAndScheduleIds(classId, date, scheduleIds)
                .stream().map(this::toDTO).toList();
    }

    /** Ghi nhận điểm danh hàng loạt cho cả lớp */
    private void backfillMissingScheduleIds(String classId, LocalDate from, LocalDate to) {
        List<AttendanceRecord> missingRecords = attendanceRepo
                .findMissingScheduleRecordsByClassAndDateRange(classId, from, to);
        if (missingRecords.isEmpty()) return;

        List<com.attendance.backend.entity.Schedule> classSchedules = scheduleRepository.findByClassId(classId);
        List<AttendanceRecord> updated = new ArrayList<>();

        for (AttendanceRecord record : missingRecords) {
            String dayOfWeek = getVietnameseDayOfWeek(record.getDate().getDayOfWeek().getValue());
            List<com.attendance.backend.entity.Schedule> schedulesForDay = classSchedules.stream()
                    .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                    .toList();
            if (schedulesForDay.size() == 1) {
                record.setScheduleId(schedulesForDay.get(0).getId());
                updated.add(record);
            }
        }

        if (!updated.isEmpty()) {
            attendanceRepo.saveAll(updated);
        }
    }

    @Transactional
    public List<AttendanceRecordDTO> bulkSave(BulkAttendanceRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());

        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        if (!date.equals(LocalDate.now(zoneId))) {
            throw new RuntimeException("Chỉ được phép điểm danh cho ngày hôm nay (" + LocalDate.now(zoneId) + ")");
        }

        // Kiểm tra học kỳ còn hiệu lực không
        semesterRepository.findByIsActiveTrue().ifPresent(semester -> {
            if (date.isAfter(semester.getEndDate())) {
                throw new RuntimeException("Học kỳ \"" + semester.getName() + "\" đã kết thúc ngày " + semester.getEndDate() + ". Không thể điểm danh.");
            }
            if (date.isBefore(semester.getStartDate())) {
                throw new RuntimeException("Học kỳ \"" + semester.getName() + "\" chưa bắt đầu (từ " + semester.getStartDate() + "). Không thể điểm danh.");
            }
        });

        // Ràng buộc 2: Chỉ được điểm danh vào những ngày có lịch dạy
        String dayOfWeekStr = getVietnameseDayOfWeek(date.getDayOfWeek().getValue());
        List<com.attendance.backend.entity.Schedule> daySchedules = scheduleRepository.findByClassId(request.getClassId()).stream()
                .filter(s -> s.getDayOfWeek().equalsIgnoreCase(dayOfWeekStr))
                .toList();
        
        if (daySchedules.isEmpty()) {
            throw new RuntimeException("Hôm nay (" + dayOfWeekStr + ") không có lịch dạy cho học phần " + request.getClassId() + ". Không thể điểm danh.");
        }

        // Ràng buộc 3: Chỉ được điểm danh trong khung giờ học (cho phép buffer 30p trước và sau)
        LocalTime nowBulk = LocalTime.now(zoneId);
        String requestedScheduleId = request.getScheduleId();
        String resolvedScheduleId = (requestedScheduleId == null || requestedScheduleId.isBlank())
                ? daySchedules.stream()
                        .filter(s -> {
                            try {
                                LocalTime start = LocalTime.parse(s.getStartTime(), TIME_FORMATTER).minusMinutes(30);
                                LocalTime end = LocalTime.parse(s.getEndTime(), TIME_FORMATTER).plusMinutes(30);
                                return !nowBulk.isBefore(start) && !nowBulk.isAfter(end);
                            } catch (DateTimeParseException e) {
                                return false;
                            }
                        })
                        .findFirst()
                        .orElse(daySchedules.get(0))
                        .getId()
                : requestedScheduleId;

        boolean scheduleMatchesClassDay = daySchedules.stream()
                .anyMatch(s -> s.getId().equals(resolvedScheduleId));
        if (!scheduleMatchesClassDay) {
            throw new RuntimeException("Lịch học không thuộc học phần/ngày điểm danh này");
        }

        logger.info("Checking attendance time for class: {}, day: {}, now: {}", request.getClassId(), dayOfWeekStr, nowBulk);

        boolean isWithinTime = daySchedules.stream().anyMatch(s -> {
            try {
                LocalTime start = LocalTime.parse(s.getStartTime(), TIME_FORMATTER).minusMinutes(30);
                LocalTime end = LocalTime.parse(s.getEndTime(), TIME_FORMATTER).plusMinutes(30);
                boolean match = !nowBulk.isBefore(start) && !nowBulk.isAfter(end);
                logger.info("Schedule: {} - {}, Match: {}", s.getStartTime(), s.getEndTime(), match);
                return match;
            } catch (DateTimeParseException e) {
                logger.error("Không thể parse giờ của schedule {}: startTime='{}', endTime='{}', lỗi: {}",
                        s.getId(), s.getStartTime(), s.getEndTime(), e.getMessage());
                return false;
            }
        });

        if (!isWithinTime) {
            String timeInfo = daySchedules.stream()
                .map(s -> s.getStartTime() + " - " + s.getEndTime())
                .reduce((a, b) -> a + ", " + b).orElse("");
            logger.warn("Attendance denied: Outside scheduled time. Now: {}, Allowed: {}", nowBulk, timeInfo);
            // Vẫn cho phép giáo viên điểm danh nhưng sẽ có log cảnh báo nếu cần
            // Ở đây ta có thể nới lỏng hơn cho Giáo viên: ví dụ cho phép cả ngày hôm đó.
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

            // Bảo toàn bản ghi FACE_ID bất kể scheduleId trong request (tránh race condition khi GV lưu trước khi SV quét mặt)
            java.util.Optional<AttendanceRecord> existingFaceRecord = attendanceRepo
                    .findByStudentIdAndDate(studentId, date).stream()
                    .filter(r -> r.getClassId().equalsIgnoreCase(request.getClassId())
                                 && resolvedScheduleId.equals(r.getScheduleId())
                                 && r.getMethod() == AttendanceRecord.Method.FACE_ID)
                    .findFirst();
            if (existingFaceRecord.isPresent()) {
                saved.add(existingFaceRecord.get());
                return;
            }

            // Upsert: nếu đã có thì cập nhật (dựa trên student, date, class và schedule)
            AttendanceRecord record = attendanceRepo
                    .findByStudentIdAndDateAndClassIdAndScheduleId(studentId, date, request.getClassId(), resolvedScheduleId)
                    .orElse(null);

            if (record == null) {
                record = attendanceRepo.findByStudentIdAndDate(studentId, date).stream()
                        .filter(r -> r.getClassId().equalsIgnoreCase(request.getClassId())
                                && r.getScheduleId() == null
                                && r.getMethod() != AttendanceRecord.Method.FACE_ID)
                        .findFirst()
                        .orElse(null);
            }

            if (record == null) {
                record = AttendanceRecord.builder()
                        .studentId(studentId)
                        .studentName(student.getName())
                        .classId(request.getClassId())
                        .date(date)
                        .scheduleId(resolvedScheduleId)
                        .method(AttendanceRecord.Method.MANUAL)
                        .build();
            }

            record.setStatus(status);
            
            // Logic mới: Tự động tính trạng thái dựa trên thời gian nếu GV chọn 'present'
            if (status == AttendanceRecord.AttendanceStatus.present) {
                com.attendance.backend.entity.Schedule sched = daySchedules.stream()
                        .filter(s -> s.getId().equals(resolvedScheduleId))
                        .findFirst().orElse(null);
                if (sched != null) {
                    LocalTime startTime = LocalTime.parse(sched.getStartTime(), TIME_FORMATTER);
                    LocalTime nowTime = LocalTime.now(zoneId);
                    
                    if (nowTime.isAfter(startTime.plusMinutes(30))) {
                        record.setStatus(AttendanceRecord.AttendanceStatus.half);
                        record.setNote("Ghi nhận sau 30p - Tính nửa buổi");
                    } else if (nowTime.isAfter(startTime.plusMinutes(15))) {
                        record.setStatus(AttendanceRecord.AttendanceStatus.late);
                        record.setNote("Ghi nhận sau 15p - Tính muộn");
                    }
                }
                record.setCheckInTime(LocalTime.now(zoneId));
            }
            record.setScheduleId(resolvedScheduleId);
            record.setMethod(AttendanceRecord.Method.MANUAL);
            record.setNote("Điểm danh thủ công");
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

    /** Cập nhật 1 bản ghi điểm danh */
    @Transactional
    public AttendanceRecordDTO updateRecord(Long id, AttendanceRecordDTO dto) {
        AttendanceRecord record = attendanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi điểm danh: " + id));

        record.setStatus(AttendanceRecord.AttendanceStatus.valueOf(dto.getStatus().toLowerCase()));
        if (dto.getNote() != null) record.setNote(dto.getNote());
        if (dto.getCheckInTime() != null) {
            try {
                record.setCheckInTime(LocalTime.parse(dto.getCheckInTime(), TIME_FORMATTER));
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Định dạng giờ check-in không hợp lệ: " + dto.getCheckInTime());
            }
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
        long late = attendanceRepo.countByStatusAndStudentAndDateRange(studentId, AttendanceRecord.AttendanceStatus.late, from, to);
        long half = attendanceRepo.countByStatusAndStudentAndDateRange(studentId, AttendanceRecord.AttendanceStatus.half, from, to);
        
        double totalPresentValue = (double) present + (late * 0.75) + (half * 0.5);
        double rate = Math.round(totalPresentValue / total * 1000.0) / 10.0;
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

    @Transactional
    public AttendanceRecordDTO checkin(String studentId, String scheduleId, String base64Image, Double userLat, Double userLng) {
        logger.info("[DEBUG] Bắt đầu Check-in cho SV: {} | Lịch dạy: {} | GPS: {}, {}", studentId, scheduleId, userLat, userLng);
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        com.attendance.backend.entity.Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));

        ensureScheduleInActiveSemester(schedule);

        if (student.getFaceEmbedding() == null) {
            logger.warn("[DEBUG] SV {} chưa đăng ký khuôn mặt", studentId);
            throw new RuntimeException("Chưa đăng ký khuôn mặt");
        }

        boolean isInClass = student.getClasses().stream()
                .anyMatch(c -> c.getId().equals(schedule.getClassId()));
        
        if (!isInClass) {
            logger.warn("[DEBUG] SV {} không thuộc lớp {}", studentId, schedule.getClassId());
            throw new RuntimeException("Sinh viên không thuộc học phần này");
        }

        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        boolean existed = attendanceRepo.findByStudentIdAndDateAndClassIdAndScheduleId(
                studentId, LocalDate.now(zoneId), schedule.getClassId(), schedule.getId()
        ).isPresent();

        if (existed) {
            logger.warn("[DEBUG] SV {} đã điểm danh lớp này hôm nay", studentId);
            throw new RuntimeException("Đã điểm danh rồi");
        }

        // Ràng buộc mới: Không cho phép điểm danh lớp khác khi lớp trước đó chưa kết thúc
        List<com.attendance.backend.entity.AttendanceRecord> todaysRecords = attendanceRepo.findByStudentIdAndDate(studentId, LocalDate.now(zoneId));
        LocalTime now = LocalTime.now(zoneId);

        for (com.attendance.backend.entity.AttendanceRecord record : todaysRecords) {
            // Bỏ qua chính lớp này nếu đã điểm danh trước đó (đã xử lý ở trên)
            if (record.getScheduleId().equals(scheduleId)) continue;
            com.attendance.backend.entity.Schedule prevSchedule = scheduleRepository.findById(record.getScheduleId()).orElse(null);
            if (prevSchedule != null) {
                LocalTime prevEndTime;
                try {
                    prevEndTime = LocalTime.parse(prevSchedule.getEndTime(), TIME_FORMATTER);
                } catch (Exception e) { continue; }
                if (now.isBefore(prevEndTime)) {
                    throw new RuntimeException("Bạn không thể điểm danh lớp mới khi lớp '" + prevSchedule.getSubject() + "' chưa kết thúc (Kết thúc lúc " + prevSchedule.getEndTime() + ")");
                }
            }
        }

        // Ràng buộc GPS: Nếu lịch học có liên kết Location, kiểm tra khoảng cách
        if (schedule.getLocationId() != null && !schedule.getLocationId().isEmpty()) {
            com.attendance.backend.entity.Location loc = locationRepository.findById(schedule.getLocationId())
                    .orElse(null);
            
            if (loc != null && loc.getIsActive()) {
                if (userLat == null || userLng == null) {
                    throw new RuntimeException("Vui lòng bật GPS để điểm danh");
                }
                
                double distance = calculateDistance(userLat, userLng, loc.getLat(), loc.getLng());
                logger.info("[DEBUG] Khoảng cách: {}m | Bán kính cho phép: {}m", distance, loc.getRadius());
                
                if (distance > loc.getRadius()) {
                    throw new RuntimeException("Bạn đang đứng ngoài phạm vi điểm danh cho phép (Cách " + Math.round(distance) + "m)");
                }
            }
        }

        try {
            logger.info("[DEBUG] Đang gửi ảnh đi xác thực khuôn mặt...");
            Map<String, Object> faceRes = faceRecognitionService.verifyFace(base64Image, student.getFaceEmbedding());
            boolean matched = (boolean) faceRes.getOrDefault("match", false);
            double similarity = (double) faceRes.getOrDefault("similarity", 0.0);
            
            logger.info("[DEBUG] Kết quả FaceID: Khớp={} | Độ tương đồng={}", matched, similarity);
            
            if (!matched) {
                throw new RuntimeException("Khuôn mặt không khớp (Độ tương đồng: " + similarity + ")");
            }
        } catch (Exception e) {
            logger.error("[DEBUG] Lỗi FaceID: {}", e.getMessage());
            throw new RuntimeException("Lỗi xác thực khuôn mặt: " + e.getMessage());
        }

        LocalTime startTime = LocalTime.parse(schedule.getStartTime(), TIME_FORMATTER);
        LocalTime endTime = LocalTime.parse(schedule.getEndTime(), TIME_FORMATTER);

        // Kiểm tra đúng thứ tự: Trước tiên kiểm tra chưa đến giờ
        if (now.isBefore(startTime)) {
            throw new RuntimeException("Chưa đến thời gian điểm danh (Tiết học bắt đầu lúc " + schedule.getStartTime() + ")");
        }

        // Sau đó kiểm tra quá 30 phút
        if (now.isAfter(startTime.plusMinutes(30))) {
            logger.warn("[DEBUG] Điểm danh thất bại: Đã quá 30 phút kể từ khi bắt đầu ({}). Giờ hiện tại: {}", startTime, now);
            throw new RuntimeException("Đã quá thời gian tự điểm danh (vượt quá 30 phút kể từ " + schedule.getStartTime() + ")");
        }

        // Tính trạng thái: muộn nếu sau 15 phút, đúng giờ nếu trong 15 phút đầu
        AttendanceRecord.AttendanceStatus status = now.isAfter(startTime.plusMinutes(15))
                ? AttendanceRecord.AttendanceStatus.late
                : AttendanceRecord.AttendanceStatus.present;

        AttendanceRecord record = AttendanceRecord.builder()
                .studentId(studentId)
                .studentName(student.getName())
                .classId(schedule.getClassId())
                .date(LocalDate.now(zoneId))
                .scheduleId(schedule.getId())
                .method(AttendanceRecord.Method.FACE_ID)
                .status(status)
                .checkInTime(now)
                .note(status == AttendanceRecord.AttendanceStatus.late ? "Đi muộn" : "Đúng giờ")
                .build();

        logger.info("[DEBUG] Điểm danh THÀNH CÔNG cho SV: {} | Trạng thái: {}", studentId, status);
        return toDTO(attendanceRepo.save(record));
    }

    @Transactional(readOnly = true)
    public List<com.attendance.backend.dto.AvailableScheduleDTO> getAvailableSchedulesForStudent(String studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên"));

        logger.info("[DEBUG] Bắt đầu tìm lịch cho SV: {}", studentId);
        
        List<String> classIds = student.getClasses().stream()
                .map(com.attendance.backend.entity.ClassRoom::getId).toList();
        
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(zoneId);
        String dayOfWeekStr = getVietnameseDayOfWeek(today.getDayOfWeek().getValue());
        LocalTime now = LocalTime.now(zoneId);

        // Kiểm tra học kỳ còn hiệu lực không
        com.attendance.backend.entity.Semester activeSemester = semesterRepository.findByIsActiveTrue().orElse(null);
        if (activeSemester != null) {
            if (today.isAfter(activeSemester.getEndDate())) {
                logger.info("[DEBUG] Học kỳ '{}' đã kết thúc ({}), không hiện lịch điểm danh.", activeSemester.getName(), activeSemester.getEndDate());
                return List.of();
            }
            if (today.isBefore(activeSemester.getStartDate())) {
                logger.info("[DEBUG] Học kỳ '{}' chưa bắt đầu ({}), không hiện lịch điểm danh.", activeSemester.getName(), activeSemester.getStartDate());
                return List.of();
            }
        }

        logger.info("[DEBUG] Lớp của SV: {} | Hôm nay: {} | Thứ: {} | Giờ hiện tại: {}", classIds, today, dayOfWeekStr, now);

        if (classIds.isEmpty()) {
            logger.warn("[DEBUG] SV {} không thuộc lớp nào!", studentId);
            return List.of();
        }

        List<com.attendance.backend.entity.Schedule> allSchedules = new ArrayList<>();
        for (String cid : classIds) {
            List<com.attendance.backend.entity.Schedule> found = scheduleRepository.findByClassIdAndDayOfWeek(cid, dayOfWeekStr);
            if (activeSemester != null) {
                found = found.stream()
                        .filter(s -> activeSemester.getId().equals(s.getSemesterId()))
                        .toList();
            }
            logger.info("[DEBUG] Lớp {}: Tìm thấy {} lịch dạy trong DB cho ngày {}", cid, found.size(), dayOfWeekStr);
            allSchedules.addAll(found);
        }

        // Ràng buộc mới: Nếu đang trong giờ học của một lớp đã điểm danh, không hiện các lớp khác
        List<com.attendance.backend.entity.AttendanceRecord> todaysRecords = attendanceRepo.findByStudentIdAndDate(studentId, today);
        final com.attendance.backend.entity.Schedule activeSchedule;
        com.attendance.backend.entity.Schedule tempActive = null;
        for (com.attendance.backend.entity.AttendanceRecord record : todaysRecords) {
            if (record.getScheduleId() == null) continue;
            com.attendance.backend.entity.Schedule s = scheduleRepository.findById(record.getScheduleId()).orElse(null);
            if (s != null) {
                try {
                    LocalTime endTime = LocalTime.parse(s.getEndTime(), TIME_FORMATTER);
                    if (now.isBefore(endTime)) {
                        tempActive = s;
                        break;
                    }
                } catch (Exception ignored) {}
            }
        }
        activeSchedule = tempActive;

        // Tập hợp classId mà sinh viên đã có bản ghi hôm nay (kể cả điểm danh thủ công không có scheduleId)
        java.util.Set<String> attendedClassIds = todaysRecords.stream()
                .map(com.attendance.backend.entity.AttendanceRecord::getClassId)
                .collect(java.util.stream.Collectors.toSet());

        List<com.attendance.backend.dto.AvailableScheduleDTO> result = allSchedules.stream().filter(s -> {
            try {
                LocalTime startTime = LocalTime.parse(s.getStartTime(), TIME_FORMATTER);
                LocalTime startLimit = startTime.minusMinutes(15);
                LocalTime endLimit = startTime.plusMinutes(30);
                boolean isMatch = !now.isBefore(startLimit) && !now.isAfter(endLimit);

                logger.info("[DEBUG] Kiểm tra môn {}: {} - {}. Khung giờ cho phép: {} - {}. Kết quả: {}",
                    s.getSubject(), s.getStartTime(), s.getEndTime(), startLimit, endLimit, isMatch);

                return isMatch;
            } catch (Exception e) {
                logger.error("[DEBUG] Lỗi parse giờ lịch dạy {}: {}", s.getId(), e.getMessage());
                return false;
            }
        }).map(s -> new com.attendance.backend.dto.AvailableScheduleDTO(
                s.getId(), s.getClassId(), s.getSubject(), s.getStartTime() + " - " + s.getEndTime(),
                attendedClassIds.contains(s.getClassId())
        )).toList();

        logger.info("[DEBUG] KẾT THÚC: Hiển thị {} lớp lên App.", result.size());
        return result;
    }

    private void ensureScheduleInActiveSemester(com.attendance.backend.entity.Schedule schedule) {
        com.attendance.backend.entity.Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("Chưa có học kỳ đang hoạt động"));

        if (!activeSemester.getId().equals(schedule.getSemesterId())) {
            throw new RuntimeException("Lịch học này không thuộc học kỳ đang hoạt động");
        }
    }

    /**
     * Tính khoảng cách giữa 2 điểm GPS (đơn vị: mét) sử dụng công thức Haversine
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Bán kính Trái Đất (km)
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Trả về mét
    }

}
