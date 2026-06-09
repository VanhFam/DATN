package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.dto.ScheduleDTO;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.utils.PaginationUtils;
import com.attendance.backend.utils.TimeUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
//    private final TeacherRepository teacherRepository;
    private final ClassRoomRepository classRoomRepository;

    public ScheduleService(ScheduleRepository scheduleRepository, 
                          TeacherRepository teacherRepository,
                          ClassRoomRepository classRoomRepository) {
        this.scheduleRepository = scheduleRepository;
//        this.teacherRepository = teacherRepository;
        this.classRoomRepository = classRoomRepository;
    }

    public List<ScheduleDTO> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(this::toDTO).toList();
    }

    public PaginatedResponse<ScheduleDTO> getSchedulesPage(String search, Long semesterId, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("dayOfWeek").ascending().and(Sort.by("startTime").ascending()));
        return PaginationUtils.fromPage(scheduleRepository.search(search, semesterId, pageable).map(this::toDTO));
    }

    public PaginatedResponse<ScheduleDTO> getSchedulesByTeacherPage(String teacherId, String search, Long semesterId, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("dayOfWeek").ascending().and(Sort.by("startTime").ascending()));
        return PaginationUtils.fromPage(scheduleRepository.searchByTeacher(teacherId, search, semesterId, pageable).map(this::toDTO));
    }

    public List<ScheduleDTO> getByClass(String classId) {
        return scheduleRepository.findByClassId(classId).stream()
                .map(this::toDTO).toList();
    }

    public List<ScheduleDTO> getByTeacher(String teacherId) {
        return scheduleRepository.findByTeacherIdIgnoreCase(teacherId).stream()
                .map(this::toDTO).toList();
    }

    /** Lịch dạy của giáo viên hôm nay */
    public List<ScheduleDTO> getByTeacherAndDay(String teacherId, String dayOfWeek) {
        return scheduleRepository.findByTeacherIdAndDayOfWeek(teacherId, dayOfWeek).stream()
                .map(this::toDTO).toList();
    }

    public ScheduleDTO getById(String id) {
        return toDTO(findOrThrow(id));
    }

    @Transactional
    public ScheduleDTO create(ScheduleDTO dto) {
        if (scheduleRepository.existsById(dto.getId())) {
            throw new RuntimeException("Mã lịch đã tồn tại: " + dto.getId());
        }

        ensureClassExists(dto.getClassId());
        validateSchedule(null, dto);
        return toDTO(scheduleRepository.save(toEntity(dto)));
    }

    @Transactional
    public ScheduleDTO update(String id, ScheduleDTO dto) {
        ensureClassExists(dto.getClassId());
        validateSchedule(id, dto);
        Schedule schedule = findOrThrow(id);
        schedule.setClassId(dto.getClassId());
        schedule.setSubject(dto.getSubject());
        schedule.setTeacherId(dto.getTeacherId());
        schedule.setTeacherName(dto.getTeacherName());
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setRoom(dto.getRoom());
        schedule.setLocationId(dto.getLocationId());
        schedule.setSemesterId(dto.getSemesterId());
        schedule.setSessionsCount(dto.getSessionsCount());
        return toDTO(scheduleRepository.save(schedule));
    }

    private int getDayValue(String day) {
        if (day == null || day.isBlank())
            throw new RuntimeException("Ngày học không được để trống");
        String d = day.toUpperCase().trim();
        if (d.contains("2") || d.contains("MON")) return 1;
        if (d.contains("3") || d.contains("TUE")) return 2;
        if (d.contains("4") || d.contains("WED")) return 3;
        if (d.contains("5") || d.contains("THU")) return 4;
        if (d.contains("6") || d.contains("FRI")) return 5;
        if (d.contains("7") || d.contains("SAT")) return 6;
        if (d.contains("CN") || d.contains("SUN") || d.contains("NHẬT")) return 7;
        throw new RuntimeException("Ngày học không hợp lệ: '" + day + "'. Dùng: Thứ 2 - Thứ 7, Chủ Nhật");
    }

    private void validateSchedule(String excludeId, ScheduleDTO dto) {
        int dayVal = getDayValue(dto.getDayOfWeek());
        String dayStr = switch(dayVal) {
            case 1 -> "Thứ 2";
            case 2 -> "Thứ 3";
            case 3 -> "Thứ 4";
            case 4 -> "Thứ 5";
            case 5 -> "Thứ 6";
            case 6 -> "Thứ 7";
            case 7 -> "Chủ Nhật";
            default -> "Thứ 2";
        };
        dto.setDayOfWeek(dayStr); 

        if (dto.getStartTime() == null || dto.getEndTime() == null)
            throw new RuntimeException("Giờ bắt đầu và giờ kết thúc không được để trống");

        java.time.LocalTime start = java.time.LocalTime.parse(dto.getStartTime(), TimeUtils.TIME_FORMATTER);
        java.time.LocalTime end = java.time.LocalTime.parse(dto.getEndTime(), TimeUtils.TIME_FORMATTER);

        if (start.isAfter(end) || start.equals(end)) {
            throw new RuntimeException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        List<Schedule> allSchedules = scheduleRepository.findAll();
        String normalizedRoom = dto.getRoom() != null ? dto.getRoom().replaceAll("\\s+", "").toUpperCase() : "";

        for (Schedule s : allSchedules) {
            if (s.getId().equals(excludeId) || s.getId().equals(dto.getId())) continue;

            // Chỉ kiểm tra xung đột trong cùng học kỳ
            Long dtoSem = dto.getSemesterId();
            Long sSem = s.getSemesterId();
            if (dtoSem != null && !dtoSem.equals(sSem)) continue;
            if (dtoSem == null && sSem != null) continue;

            if (getDayValue(s.getDayOfWeek()) != dayVal) continue;

            java.time.LocalTime sStart, sEnd;
            try {
                sStart = java.time.LocalTime.parse(s.getStartTime(), TimeUtils.TIME_FORMATTER);
                sEnd   = java.time.LocalTime.parse(s.getEndTime(),   TimeUtils.TIME_FORMATTER);
            } catch (Exception ignored) {
                continue;
            }

            // Chỉ kiểm tra nếu giờ học chồng lên nhau
            boolean overlaps = start.isBefore(sEnd) && end.isAfter(sStart);
            if (!overlaps) continue;

            // Rule 1: Một lớp không được học 2 môn trong cùng 1 khung giờ
            if (s.getClassId() != null && s.getClassId().equalsIgnoreCase(dto.getClassId())) {
                throw new RuntimeException(
                    "Xung đột lịch lớp: Lớp " + s.getClassId() +
                    " đã có lịch học môn \"" + s.getSubject() +
                    "\" vào " + dayStr + " từ " + s.getStartTime() + " đến " + s.getEndTime() +
                    ". Vui lòng chọn khung giờ sau " + s.getEndTime() + "."
                );
            }

            // Rule 2: Một giảng viên không được dạy 2 lớp trong cùng 1 khung giờ
            if (s.getTeacherId() != null && s.getTeacherId().equalsIgnoreCase(dto.getTeacherId())) {
                throw new RuntimeException(
                    "Xung đột lịch giảng viên: Giảng viên \"" + s.getTeacherName() +
                    "\" đã được xếp dạy lớp " + s.getClassId() +
                    " vào " + dayStr + " từ " + s.getStartTime() + " đến " + s.getEndTime() +
                    ". Một giảng viên không thể dạy 2 lớp cùng lúc."
                );
            }

            // Rule 3: Một phòng không được dùng 2 lớp trong cùng 1 khung giờ (nếu có chỉ định phòng)
            String sRoom = s.getRoom() != null ? s.getRoom().replaceAll("\\s+", "").toUpperCase() : "";
            if (!normalizedRoom.isEmpty() && !sRoom.isEmpty() && normalizedRoom.equals(sRoom)) {
                throw new RuntimeException(
                    "Xung đột phòng học: Phòng " + dto.getRoom() +
                    " đã được xếp cho lớp " + s.getClassId() +
                    " vào " + dayStr + " từ " + s.getStartTime() + " đến " + s.getEndTime() + "."
                );
            }

            // Cho phép: khác lớp + khác giảng viên + khác phòng → OK dù cùng khung giờ
        }

        validateSessionsAllocation(excludeId, dto, allSchedules);
    }

    private void validateSessionsAllocation(String excludeId, ScheduleDTO dto, List<Schedule> allSchedules) {
        int currentSessions = dto.getSessionsCount() != null ? dto.getSessionsCount() : 0;
        if (currentSessions < 0) {
            throw new RuntimeException("Số buổi phụ trách không được âm");
        }

        ClassRoom classRoom = classRoomRepository.findById(dto.getClassId())
                .orElseThrow(() -> new RuntimeException("Học phần '" + dto.getClassId() + "' không tồn tại trong hệ thống"));
        Integer totalSessions = classRoom.getTotalSessions();
        if (totalSessions == null || totalSessions <= 0) return;

        int allocatedSessions = allSchedules.stream()
                .filter(s -> !s.getId().equals(excludeId) && !s.getId().equals(dto.getId()))
                .filter(s -> s.getClassId() != null && s.getClassId().equalsIgnoreCase(dto.getClassId()))
                .filter(s -> {
                    Long dtoSem = dto.getSemesterId();
                    Long sSem = s.getSemesterId();
                    if (dtoSem == null) return sSem == null;
                    return dtoSem.equals(sSem);
                })
                .mapToInt(s -> s.getSessionsCount() != null ? s.getSessionsCount() : 0)
                .sum();

        int totalAllocated = allocatedSessions + currentSessions;
        if (totalAllocated > totalSessions) {
            throw new RuntimeException(
                    "Tổng số buổi trong lịch dạy của học phần " + dto.getClassId()
                            + " đang là " + totalAllocated + " buổi, vượt quá tổng số buổi học phần là "
                            + totalSessions + ". Vui lòng chia lại số buổi cho các lịch dùng chung học phần này."
            );
        }
    }

    @Transactional
    public void delete(String id) {
        findOrThrow(id);
        scheduleRepository.deleteById(id);
    }

    private void ensureClassExists(String classId) {
        if (classId == null || classId.trim().isEmpty())
            throw new RuntimeException("Mã học phần không được để trống");
        if (!classRoomRepository.existsById(classId.trim()))
            throw new RuntimeException("Học phần '" + classId.trim() + "' không tồn tại trong hệ thống");
    }

    private Schedule findOrThrow(String id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học: " + id));
    }

    private ScheduleDTO toDTO(Schedule s) {
        return ScheduleDTO.builder()
                .id(s.getId())
                .classId(s.getClassId())
                .subject(s.getSubject())
                .teacherId(s.getTeacherId())
                .teacherName(s.getTeacherName())
                .dayOfWeek(s.getDayOfWeek())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .room(s.getRoom())
                .locationId(s.getLocationId())
                .semesterId(s.getSemesterId())
                .sessionsCount(s.getSessionsCount())
                .build();
    }

    private Schedule toEntity(ScheduleDTO dto) {
        return Schedule.builder()
                .id(dto.getId())
                .classId(dto.getClassId())
                .subject(dto.getSubject())
                .teacherId(dto.getTeacherId())
                .teacherName(dto.getTeacherName())
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .room(dto.getRoom())
                .locationId(dto.getLocationId())
                .semesterId(dto.getSemesterId())
                .sessionsCount(dto.getSessionsCount())
                .build();
    }
}
