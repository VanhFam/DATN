package com.attendance.backend.service;

import com.attendance.backend.dto.StudentDTO;
import com.attendance.backend.entity.Student;
import com.attendance.backend.entity.User;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassRoomRepository classRoomRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public StudentService(StudentRepository studentRepository, UserRepository userRepository, 
                          PasswordEncoder passwordEncoder, ClassRoomRepository classRoomRepository,
                          AttendanceRecordRepository attendanceRecordRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.classRoomRepository = classRoomRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getStudentsByClass(String classId) {
        return studentRepository.findByClassId(classId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getStudentsByClasses(List<String> classIds) {
        return studentRepository.findByClassIds(classIds).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getStudentsByAttendanceClasses(List<String> classIds) {
        return studentRepository.findByAttendanceClassIds(classIds).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentDTO getStudentById(String id) {
        return toDTO(findOrThrow(id));
    }

    @Transactional
    public StudentDTO createStudent(StudentDTO dto) {
        if (studentRepository.existsById(dto.getId())) {
            throw new RuntimeException("Mã sinh viên đã tồn tại: " + dto.getId());
        }

        // Tạo tài khoản user cho sinh viên
        User user = User.builder()
                .username(dto.getId())
                .passwordHash(passwordEncoder.encode(dto.getId())) // default password = studentId
                .role(User.Role.STUDENT)
                .name(dto.getName())
                .phone(dto.getPhone())
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .id(dto.getId())
                .name(dto.getName())
                .gender(dto.getGender())
                .dob(dto.getDob())
                .phone(dto.getPhone())
                .faceImagePath(dto.getFaceImagePath())
                .faceEmbedding(dto.getFaceEmbedding())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .userId(user.getId())
                .build();
        
        syncClasses(student, dto.getClassId());
        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public StudentDTO updateStudent(String id, StudentDTO dto) {
        Student student = findOrThrow(id);

        student.setName(dto.getName());
        syncClasses(student, dto.getClassId());
        student.setGender(dto.getGender());
        student.setDob(dto.getDob());
        student.setPhone(dto.getPhone());
        if (dto.getFaceImagePath() != null) {
            student.setFaceImagePath(dto.getFaceImagePath());
        }
        if (dto.getFaceEmbedding() != null) {
            student.setFaceEmbedding(dto.getFaceEmbedding());
        }
        if (dto.getIsActive() != null) {
            student.setIsActive(dto.getIsActive());
        }

        // Sync user info
        if (student.getUserId() != null) {
            userRepository.findById(student.getUserId()).ifPresent(user -> {
                user.setName(dto.getName());
                user.setPhone(dto.getPhone());
                if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());
                userRepository.save(user);
            });
        }

        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public void deleteStudent(String id) {
        Student student = findOrThrow(id);
        
        // 1. Xóa tất cả bản ghi điểm danh của sinh viên này
        attendanceRecordRepository.deleteByStudentId(id);
        
        // 2. Xóa sinh viên
        studentRepository.deleteById(id);
        
        // 3. Xóa tài khoản user liên kết
        if (student.getUserId() != null) {
            userRepository.deleteById(student.getUserId());
        }
    }

    @Transactional
    public StudentDTO toggleActive(String id) {
        Student student = findOrThrow(id);
        student.setIsActive(!student.getIsActive());
        if (student.getUserId() != null) {
            userRepository.findById(student.getUserId()).ifPresent(user -> {
                user.setIsActive(student.getIsActive());
                userRepository.save(user);
            });
        }
        return toDTO(studentRepository.save(student));
    }

    private void syncClasses(Student student, String classIdStr) {
        if (classIdStr == null || classIdStr.trim().isEmpty() || classIdStr.equals("null")) {
            student.getClasses().clear();
            return;
        }

        Set<String> classIds = Arrays.stream(classIdStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        Set<ClassRoom> classRooms = new HashSet<>();
        for (String id : classIds) {
            if (!classRoomRepository.existsById(id)) {
                ClassRoom newClass = new ClassRoom(id, id, "Tự động tạo từ hệ thống");
                classRooms.add(classRoomRepository.save(newClass));
            } else {
                classRoomRepository.findById(id).ifPresent(classRooms::add);
            }
        }
        student.setClasses(classRooms);
    }

    private Student findOrThrow(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sinh viên: " + id));
    }

    private StudentDTO toDTO(Student s) {
        return StudentDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .classId(s.getClassId())
                .gender(s.getGender())
                .dob(s.getDob())
                .phone(s.getPhone())
                .faceImagePath(s.getFaceImagePath())
                .faceEmbedding(s.getFaceEmbedding())
                .isActive(s.getIsActive())
                .build();
    }
}
