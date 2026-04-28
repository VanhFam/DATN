package com.attendance.backend.service;

import com.attendance.backend.dto.ScheduleDTO;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRoomRepository classRoomRepository;

    public ScheduleService(ScheduleRepository scheduleRepository, 
                          TeacherRepository teacherRepository,
                          ClassRoomRepository classRoomRepository) {
        this.scheduleRepository = scheduleRepository;
        this.teacherRepository = teacherRepository;
        this.classRoomRepository = classRoomRepository;
    }

    public List<ScheduleDTO> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(this::toDTO).toList();
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
        validateSchedule(dto);
        return toDTO(scheduleRepository.save(toEntity(dto)));
    }

    @Transactional
    public ScheduleDTO update(String id, ScheduleDTO dto) {
        ensureClassExists(dto.getClassId());
        validateSchedule(dto);
        Schedule schedule = findOrThrow(id);
        schedule.setClassId(dto.getClassId());
        schedule.setSubject(dto.getSubject());
        schedule.setTeacherId(dto.getTeacherId());
        schedule.setTeacherName(dto.getTeacherName());
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setRoom(dto.getRoom());
        return toDTO(scheduleRepository.save(schedule));
    }

    private void validateSchedule(ScheduleDTO dto) {
        java.time.LocalTime start = java.time.LocalTime.parse(dto.getStartTime());
        java.time.LocalTime end = java.time.LocalTime.parse(dto.getEndTime());

        if (start.isAfter(end) || start.equals(end)) {
            throw new RuntimeException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        // 1. Kiểm tra trùng lịch cho Giáo viên
        List<Schedule> teacherSchedules = scheduleRepository.findByTeacherIdAndDayOfWeek(dto.getTeacherId(), dto.getDayOfWeek());
        for (Schedule s : teacherSchedules) {
            if (s.getId().equals(dto.getId())) continue; // Bỏ qua chính nó khi update
            
            java.time.LocalTime sStart = java.time.LocalTime.parse(s.getStartTime());
            java.time.LocalTime sEnd = java.time.LocalTime.parse(s.getEndTime());

            // Overlap condition: (StartA < EndB) AND (EndA > StartB)
            if (start.isBefore(sEnd) && end.isAfter(sStart)) {
                throw new RuntimeException("Giáo viên đã có lịch dạy lớp " + s.getClassId() + " (" + s.getStartTime() + " - " + s.getEndTime() + ") vào " + dto.getDayOfWeek());
            }
        }

        // 2. Kiểm tra trùng lịch cho Lớp học (Học sinh)
        List<Schedule> classSchedules = scheduleRepository.findByClassIdAndDayOfWeek(dto.getClassId(), dto.getDayOfWeek());
        for (Schedule s : classSchedules) {
            if (s.getId().equals(dto.getId())) continue;
            
            java.time.LocalTime sStart = java.time.LocalTime.parse(s.getStartTime());
            java.time.LocalTime sEnd = java.time.LocalTime.parse(s.getEndTime());

            if (start.isBefore(sEnd) && end.isAfter(sStart)) {
                throw new RuntimeException("Lớp " + dto.getClassId() + " đã có lịch học môn " + s.getSubject() + " (" + s.getStartTime() + " - " + s.getEndTime() + ") vào " + dto.getDayOfWeek());
            }
        }
    }

    @Transactional
    public void delete(String id) {
        findOrThrow(id);
        scheduleRepository.deleteById(id);
    }

    private String ensureClassExists(String classId) {
        if (classId == null || classId.trim().isEmpty()) {
            return null;
        }
        
        String trimmedId = classId.trim();
        if (!classRoomRepository.existsById(trimmedId)) {
            // Nếu không tồn tại, tự động tạo mới học phần này
            ClassRoom newClass = new ClassRoom(trimmedId, trimmedId, "Tự động tạo từ Lịch học");
            classRoomRepository.save(newClass);
        }
        return trimmedId;
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
                .build();
    }
}
