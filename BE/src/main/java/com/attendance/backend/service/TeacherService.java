package com.attendance.backend.service;

import com.attendance.backend.dto.TeacherDTO;
import com.attendance.backend.entity.Teacher;
import com.attendance.backend.entity.User;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassRoomRepository classRoomRepository;
    private final ScheduleRepository scheduleRepository;

    public TeacherService(TeacherRepository teacherRepository, UserRepository userRepository, 
                          PasswordEncoder passwordEncoder, ClassRoomRepository classRoomRepository,
                          ScheduleRepository scheduleRepository) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.classRoomRepository = classRoomRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public List<TeacherDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public TeacherDTO getTeacherById(String id) {
        return toDTO(findOrThrow(id));
    }

    @Transactional
    public TeacherDTO createTeacher(TeacherDTO dto) {
        if (teacherRepository.existsById(dto.getId())) {
            throw new RuntimeException("Mã giáo viên đã tồn tại: " + dto.getId());
        }

        // Tạo tài khoản user cho giáo viên
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
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .userId(user.getId())
                .build();

        return toDTO(teacherRepository.save(teacher));
    }

    @Transactional
    public TeacherDTO updateTeacher(String id, TeacherDTO dto) {
        Teacher teacher = findOrThrow(id);

        teacher.setName(dto.getName());
        teacher.setEmail(dto.getEmail());
        teacher.setPhone(dto.getPhone());
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
        
        // 1. Xóa tất cả lịch dạy của giáo viên này
        scheduleRepository.deleteByTeacherId(id);
        
        // 2. Xóa giáo viên
        teacherRepository.deleteById(id);
        
        // 3. Xóa tài khoản user liên kết
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
                .isActive(t.getIsActive())
                .build();
    }
}
