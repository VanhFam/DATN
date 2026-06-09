package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.dto.StudentDTO;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.entity.Student;
import com.attendance.backend.entity.User;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.UserRepository;
import com.attendance.backend.entity.Schedule;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassRoomRepository classRoomRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FaceRecognitionService faceRecognitionService;
    private final ScheduleRepository scheduleRepository;

    public StudentService(StudentRepository studentRepository, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, ClassRoomRepository classRoomRepository,
                          AttendanceRecordRepository attendanceRecordRepository,
                          FaceRecognitionService faceRecognitionService,
                          ScheduleRepository scheduleRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.classRoomRepository = classRoomRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.faceRecognitionService = faceRecognitionService;
        this.scheduleRepository = scheduleRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAllWithClasses().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<StudentDTO> getStudentsPage(String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(studentRepository.searchAllWithClasses(search, pageable).map(this::toDTO));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<StudentDTO> getStudentsByClassesPage(List<String> classIds, String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(studentRepository.searchByClassIdsWithClasses(classIds, search, pageable).map(this::toDTO));
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
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && studentRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng bởi học sinh khác: " + dto.getEmail());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank() && studentRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng bởi học sinh khác: " + dto.getPhone());
        }

        User user = User.builder()
                .username(dto.getId())
                .passwordHash(passwordEncoder.encode(dto.getId())) // default password = studentId
                .role(User.Role.STUDENT)
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .id(dto.getId())
                .name(dto.getName())
                .gender(dto.getGender())
                .dob(dto.getDob())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .faceImagePath(dto.getFaceImagePath())
                .faceEmbedding(dto.getFaceEmbedding())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .userId(user.getId())
                .build();

        syncClasses(student, dto.getClassId());
        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public List<StudentDTO> createStudentsBulk(List<StudentDTO> dtos) {
        // Validate toàn bộ trước khi tạo bất kỳ record nào
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            StudentDTO dto = dtos.get(i);
            int row = i + 1;
            if (dto.getId() == null || dto.getId().isBlank()) {
                errors.add("Dòng " + row + ": Mã sinh viên không được để trống");
                continue;
            }
            if (studentRepository.existsById(dto.getId()))
                errors.add("Dòng " + row + ": Mã SV '" + dto.getId() + "' đã tồn tại");
            if (dto.getEmail() != null && !dto.getEmail().isBlank()
                    && studentRepository.existsByEmail(dto.getEmail()))
                errors.add("Dòng " + row + ": Email '" + dto.getEmail() + "' đã được sử dụng");
            if (dto.getPhone() != null && !dto.getPhone().isBlank()
                    && studentRepository.existsByPhone(dto.getPhone()))
                errors.add("Dòng " + row + ": SĐT '" + dto.getPhone() + "' đã được sử dụng");
        }
        if (!errors.isEmpty()) {
            throw new RuntimeException("Lỗi import:\n" + String.join("\n", errors));
        }
        // Tất cả hợp lệ → tạo trong cùng transaction, lỗi DB sẽ rollback toàn bộ
        return dtos.stream().map(this::createStudentInternal).toList();
    }

    /** Tạo student không validate lại (đã validate ở bulk) */
    private StudentDTO createStudentInternal(StudentDTO dto) {
        User user = User.builder()
                .username(dto.getId())
                .passwordHash(passwordEncoder.encode(dto.getId()))
                .role(User.Role.STUDENT)
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .isActive(true)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .id(dto.getId())
                .name(dto.getName())
                .gender(dto.getGender())
                .dob(dto.getDob())
                .phone(dto.getPhone())
                .email(dto.getEmail())
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

        if (dto.getEmail() != null && !dto.getEmail().isBlank()
                && !dto.getEmail().equals(student.getEmail())
                && studentRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng bởi học sinh khác: " + dto.getEmail());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()
                && !dto.getPhone().equals(student.getPhone())
                && studentRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng bởi học sinh khác: " + dto.getPhone());
        }

        student.setName(dto.getName());
        syncClasses(student, dto.getClassId());
        student.setGender(dto.getGender());
        student.setDob(dto.getDob());
        student.setPhone(dto.getPhone());
        student.setEmail(dto.getEmail());
        if (dto.getFaceImagePath() != null) student.setFaceImagePath(dto.getFaceImagePath());
        if (dto.getFaceEmbedding() != null) student.setFaceEmbedding(dto.getFaceEmbedding());
        if (dto.getIsActive() != null) student.setIsActive(dto.getIsActive());

        if (student.getUserId() != null) {
            userRepository.findById(student.getUserId()).ifPresent(user -> {
                user.setName(dto.getName());
                user.setPhone(dto.getPhone());
                user.setEmail(dto.getEmail());
                if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());
                userRepository.save(user);
            });
        } else {
            userRepository.findByUsername(student.getId()).ifPresent(user -> {
                student.setUserId(user.getId());
                user.setName(dto.getName());
                user.setPhone(dto.getPhone());
                user.setEmail(dto.getEmail());
                if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());
                userRepository.save(user);
            });
        }

        return toDTO(studentRepository.save(student));
    }

    @Transactional
    public void deleteStudent(String id) {
        Student student = findOrThrow(id);
        
        long attendanceCount = attendanceRecordRepository.countTotalByStudentAndDateRange(id, java.time.LocalDate.of(2000, 1, 1), java.time.LocalDate.of(2100, 1, 1));
        if (attendanceCount > 0) {
            throw new RuntimeException("Sinh viên đã có lịch sử điểm danh, vui lòng sử dụng tính năng Vô hiệu hóa (Soft Delete) thay vì xóa");
        }

        attendanceRecordRepository.deleteByStudentId(id);
        studentRepository.deleteById(id);
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

        List<String> notFound = new ArrayList<>();
        Set<ClassRoom> classRooms = new HashSet<>();
        for (String cid : classIds) {
            classRoomRepository.findById(cid).ifPresentOrElse(
                classRooms::add,
                () -> notFound.add(cid)
            );
        }
        if (!notFound.isEmpty()) {
            throw new RuntimeException("Học phần không tồn tại: " + String.join(", ", notFound));
        }

        // Kiểm tra logic: không học 2 lớp cùng môn trong 1 học kỳ
        java.util.Map<String, String> enrolledSubjects = new java.util.HashMap<>();
        for (ClassRoom cr : classRooms) {
            String code = cr.getSubjectCode();
            if (code == null || code.trim().isEmpty()) {
                continue; // Bỏ qua nếu lớp học chưa có mã môn chuẩn
            }
            List<Schedule> schedules = scheduleRepository.findByClassId(cr.getId());
            String semesterKey = "UNSCHEDULED";
            if (!schedules.isEmpty() && schedules.get(0).getSemesterId() != null) {
                semesterKey = String.valueOf(schedules.get(0).getSemesterId());
            }

            String key = semesterKey + "-" + code;
            if (enrolledSubjects.containsKey(key)) {
                throw new RuntimeException("Học sinh không thể học môn có mã " + code + 
                        " ở 2 lớp khác nhau (" + enrolledSubjects.get(key) + " và " + cr.getId() + ") trong cùng một học kỳ!");
            }
            enrolledSubjects.put(key, cr.getId());
        }

        student.setClasses(classRooms);
    }

    private Set<Long> resolveSemesterIds(ClassRoom classRoom) {
        if (classRoom.getSemesterId() != null) {
            return Set.of(classRoom.getSemesterId());
        }
        return scheduleRepository.findByClassId(classRoom.getId()).stream()
                .map(Schedule::getSemesterId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
    }

    @Transactional
    public void registerFace(String studentId, String base64Image) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));

        if (student.getFaceEmbedding() != null && !student.getFaceEmbedding().trim().isEmpty()) {
            throw new RuntimeException("Khuôn mặt đã được đăng ký. Vui lòng sử dụng chức năng cập nhật.");
        }

        // Chỉ load SV đã có embedding thay vì load toàn bộ
        List<Student> studentsWithFace = studentRepository.findAllWithFaceEmbedding();
        String matchedId = faceRecognitionService.findMatchingStudent(base64Image, studentsWithFace);
        if (matchedId != null) {
            throw new RuntimeException("Khuôn mặt này đã được đăng ký trên hệ thống.");
        }

        faceRecognitionService.registerFace(studentId, base64Image);
    }

    @Transactional
    public void updateFace(String studentId, String base64Image) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));

        if (student.getFaceEmbedding() == null || student.getFaceEmbedding().trim().isEmpty()) {
            throw new RuntimeException("Bạn chưa đăng ký khuôn mặt. Vui lòng sử dụng chức năng đăng ký.");
        }

        // Chỉ load SV đã có embedding thay vì load toàn bộ
        List<Student> studentsWithFace = studentRepository.findAllWithFaceEmbedding();
        String matchedId = faceRecognitionService.findMatchingStudent(base64Image, studentsWithFace);
        if (matchedId != null && !matchedId.equals(studentId)) {
            throw new RuntimeException("Khuôn mặt này đã được đăng ký bởi người khác.");
        }

        faceRecognitionService.registerFace(studentId, base64Image);
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
                .email(s.getEmail())
                .faceImagePath(s.getFaceImagePath())
                .faceEmbedding(s.getFaceEmbedding())
                .isActive(s.getIsActive())
                .build();
    }
}
