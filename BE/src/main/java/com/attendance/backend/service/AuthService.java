package com.attendance.backend.service;

import com.attendance.backend.dto.LoginRequest;
import com.attendance.backend.dto.LoginResponse;
import com.attendance.backend.entity.Student;
import com.attendance.backend.entity.Teacher;
import com.attendance.backend.entity.User;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import com.attendance.backend.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, StudentRepository studentRepository, TeacherRepository teacherRepository, JwtTokenProvider tokenProvider, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

        // Resolve profile ID (studentId or teacherId) and classId
        String profileId = null;
        String classId = null;
        
        if (user.getRole() == User.Role.STUDENT) {
            Student s = studentRepository.findByUserId(user.getId()).orElse(null);
            if (s != null) {
                profileId = s.getId();
                classId = s.getClassId();
            }
        } else if (user.getRole() == User.Role.TEACHER) {
            profileId = teacherRepository.findByUserId(user.getId())
                    .map(Teacher::getId).orElse(null);
        }

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(profileId != null ? profileId : String.valueOf(user.getId()))
                .username(user.getUsername())
                .name(user.getName())
                .role(user.getRole().name())
                .email(user.getEmail())
                .classId(classId)
                .build();
    }

    private String resolveProfileId(User user) {
        return switch (user.getRole()) {
            case STUDENT -> studentRepository.findByUserId(user.getId())
                    .map(Student::getId).orElse(null);
            case TEACHER -> teacherRepository.findByUserId(user.getId())
                    .map(Teacher::getId).orElse(null);
            default -> null;
        };
    }
}
