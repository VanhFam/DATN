package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.entity.User;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;


@Service
public class    UserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       StudentRepository studentRepository,
                       TeacherRepository teacherRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public List<Map<String, Object>> getAllUsers() {
        syncMissingStudentUsers();
        syncMissingTeacherUsers();
        return userRepository.findAll().stream()
                .map(this::toUserMap)
                .toList();
    }

    @Transactional
    public PaginatedResponse<Map<String, Object>> getUsersPage(String search, Integer page, Integer limit) {
        syncMissingStudentUsers();
        syncMissingTeacherUsers();
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(userRepository.search(search, pageable).map(this::toUserMap));
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("role", user.getRole() != null ? user.getRole().name() : null);
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("isActive", user.getIsActive());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());
        return map;
    }

    private void syncMissingStudentUsers() {
        studentRepository.findAll().forEach(student -> {
            if (student.getId() == null || student.getId().isBlank()) return;

            User user = userRepository.findByUsername(student.getId())
                    .orElseGet(() -> userRepository.save(User.builder()
                            .username(student.getId())
                            .passwordHash(passwordEncoder.encode(student.getId()))
                            .role(User.Role.STUDENT)
                            .name(student.getName())
                            .phone(student.getPhone())
                            .email(student.getEmail())
                            .isActive(student.getIsActive() != null ? student.getIsActive() : true)
                            .build()));

            boolean changed = false;
            if (student.getUserId() == null || !student.getUserId().equals(user.getId())) {
                student.setUserId(user.getId());
                changed = true;
            }
            if (user.getRole() == User.Role.STUDENT) {
                user.setName(student.getName());
                user.setPhone(student.getPhone());
                user.setEmail(student.getEmail());
                user.setIsActive(student.getIsActive() != null ? student.getIsActive() : true);
                userRepository.save(user);
            }
            if (changed) {
                studentRepository.save(student);
            }
        });
    }

    private void syncMissingTeacherUsers() {
        teacherRepository.findAll().forEach(teacher -> {
            if (teacher.getId() == null || teacher.getId().isBlank()) return;

            User user = userRepository.findByUsername(teacher.getId())
                    .orElseGet(() -> userRepository.save(User.builder()
                            .username(teacher.getId())
                            .passwordHash(passwordEncoder.encode(teacher.getId()))
                            .role(User.Role.TEACHER)
                            .name(teacher.getName())
                            .phone(teacher.getPhone())
                            .email(teacher.getEmail())
                            .isActive(teacher.getIsActive() != null ? teacher.getIsActive() : true)
                            .build()));

            boolean changed = false;
            if (teacher.getUserId() == null || !teacher.getUserId().equals(user.getId())) {
                teacher.setUserId(user.getId());
                changed = true;
            }
            if (user.getRole() == User.Role.TEACHER) {
                user.setName(teacher.getName());
                user.setPhone(teacher.getPhone());
                user.setEmail(teacher.getEmail());
                user.setIsActive(teacher.getIsActive() != null ? teacher.getIsActive() : true);
                userRepository.save(user);
            }
            if (changed) {
                teacherRepository.save(teacher);
            }
        });
    }

    @Transactional
    public void updateProfile(String username, String name, String email) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setName(name);
        user.setEmail(email);
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void toggleActive(Long id, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Bạn không thể tự khóa tài khoản của chính mình");
        }
        
        user.setIsActive(!user.getIsActive());
        userRepository.saveAndFlush(user);
    }
}
