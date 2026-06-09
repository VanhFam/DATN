package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.dto.TeacherDTO;
import com.attendance.backend.entity.Teacher;
import com.attendance.backend.entity.User;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ScheduleRepository scheduleRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public TeacherService(TeacherRepository teacherRepository, UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          ScheduleRepository scheduleRepository,
                          AttendanceRecordRepository attendanceRecordRepository) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.scheduleRepository = scheduleRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    public List<TeacherDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public PaginatedResponse<TeacherDTO> getTeachersPage(String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(teacherRepository.search(search, pageable).map(this::toDTO));
    }

    public TeacherDTO getTeacherById(String id) {
        return toDTO(findOrThrow(id));
    }

    @Transactional
    public TeacherDTO createTeacher(TeacherDTO dto) {
        if (teacherRepository.existsById(dto.getId())) {
            throw new RuntimeException("Mã giáo viên đã tồn tại: " + dto.getId());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && teacherRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng bởi giáo viên khác: " + dto.getEmail());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank() && teacherRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng bởi giáo viên khác: " + dto.getPhone());
        }

        User user = User.builder()
                .username(dto.getId())
                .passwordHash(passwordEncoder.encode(dto.getId())) // default password = teacherId
                .role(User.Role.TEACHER)
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .id(dto.getId())
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .gender(dto.getGender())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .userId(user.getId())
                .build();

        return toDTO(teacherRepository.save(teacher));
    }

    @Transactional
    public List<TeacherDTO> createTeachersBulk(List<TeacherDTO> dtos) {
        // Validate toàn bộ trước khi tạo bất kỳ record nào
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            TeacherDTO dto = dtos.get(i);
            int row = i + 1;
            if (dto.getId() == null || dto.getId().isBlank()) {
                errors.add("Dòng " + row + ": Mã giáo viên không được để trống");
                continue;
            }
            if (teacherRepository.existsById(dto.getId()))
                errors.add("Dòng " + row + ": Mã GV '" + dto.getId() + "' đã tồn tại");
            if (dto.getEmail() != null && !dto.getEmail().isBlank()
                    && teacherRepository.existsByEmail(dto.getEmail()))
                errors.add("Dòng " + row + ": Email '" + dto.getEmail() + "' đã được sử dụng");
            if (dto.getPhone() != null && !dto.getPhone().isBlank()
                    && teacherRepository.existsByPhone(dto.getPhone()))
                errors.add("Dòng " + row + ": SĐT '" + dto.getPhone() + "' đã được sử dụng");
        }
        if (!errors.isEmpty()) {
            throw new RuntimeException("Lỗi import:\n" + String.join("\n", errors));
        }
        // Tất cả hợp lệ → tạo trong cùng transaction, lỗi DB sẽ rollback toàn bộ
        return dtos.stream().map(this::createTeacherInternal).toList();
    }

    /** Tạo teacher không validate lại (đã validate ở bulk) */
    private TeacherDTO createTeacherInternal(TeacherDTO dto) {
        User user = User.builder()
                .username(dto.getId())
                .passwordHash(passwordEncoder.encode(dto.getId()))
                .role(User.Role.TEACHER)
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .id(dto.getId())
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .gender(dto.getGender())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .userId(user.getId())
                .build();

        return toDTO(teacherRepository.save(teacher));
    }

    @Transactional
    public TeacherDTO updateTeacher(String id, TeacherDTO dto) {
        Teacher teacher = findOrThrow(id);

        if (dto.getEmail() != null && !dto.getEmail().isBlank()
                && !dto.getEmail().equals(teacher.getEmail())
                && teacherRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng bởi giáo viên khác: " + dto.getEmail());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()
                && !dto.getPhone().equals(teacher.getPhone())
                && teacherRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng bởi giáo viên khác: " + dto.getPhone());
        }

        teacher.setName(dto.getName());
        teacher.setEmail(dto.getEmail());
        teacher.setPhone(dto.getPhone());
        teacher.setGender(dto.getGender());
        if (dto.getIsActive() != null) {
            teacher.setIsActive(dto.getIsActive());
        }

        if (teacher.getUserId() != null) {
            userRepository.findById(teacher.getUserId()).ifPresent(user -> {
                user.setName(dto.getName());
                user.setEmail(dto.getEmail());
                user.setPhone(dto.getPhone());
                if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());
                userRepository.save(user);
            });
        }

        return toDTO(teacherRepository.save(teacher));
    }

    @Transactional
    public void deleteTeacher(String id) {
        Teacher teacher = findOrThrow(id);

        // 1. Lấy danh sách scheduleId của GV này trước khi xóa schedule
        List<String> scheduleIds = scheduleRepository.findByTeacherIdIgnoreCase(id)
                .stream().map(s -> s.getId()).toList();

        if (!scheduleIds.isEmpty()) {
            throw new RuntimeException("Giáo viên đang có lịch dạy, không thể xóa. Vui lòng chuyển lịch dạy cho giáo viên khác hoặc sử dụng chức năng vô hiệu hóa.");
        }

        // 4. Xóa teacher
        teacherRepository.deleteById(id);

        // 5. Xóa tài khoản user liên kết
        if (teacher.getUserId() != null) {
            userRepository.deleteById(teacher.getUserId());
        }
    }

    @Transactional
    public TeacherDTO toggleActive(String id) {
        Teacher teacher = findOrThrow(id);
        teacher.setIsActive(!teacher.getIsActive());
        if (teacher.getUserId() != null) {
            userRepository.findById(teacher.getUserId()).ifPresent(user -> {
                user.setIsActive(teacher.getIsActive());
                userRepository.save(user);
            });
        }
        return toDTO(teacherRepository.save(teacher));
    }

    private Teacher findOrThrow(String id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên: " + id));
    }

    private TeacherDTO toDTO(Teacher t) {
        return TeacherDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .email(t.getEmail())
                .phone(t.getPhone())
                .gender(t.getGender())
                .isActive(t.getIsActive())
                .build();
    }
}
