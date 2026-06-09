package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.SemesterRepository;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final SemesterRepository semesterRepository;

    public ClassRoomService(ClassRoomRepository classRoomRepository,
                            AttendanceRecordRepository attendanceRecordRepository,
                            ScheduleRepository scheduleRepository,
                            StudentRepository studentRepository,
                            UserRepository userRepository,
                            TeacherRepository teacherRepository,
                            SemesterRepository semesterRepository) {
        this.classRoomRepository = classRoomRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.semesterRepository = semesterRepository;
    }

    public List<ClassRoom> getAllClasses() {
        return classRoomRepository.findAll();
    }

    public PaginatedResponse<ClassRoom> getClassesPage(String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(classRoomRepository.search(search, pageable));
    }

    public List<ClassRoom> getByIds(List<String> ids) {
        return classRoomRepository.findAllById(ids);
    }

    public ClassRoom getById(String id) {
        return classRoomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp: " + id));
    }

    @Transactional
    public ClassRoom create(ClassRoom classRoom) {
        if (classRoom.getId() == null || classRoom.getId().isBlank())
            throw new RuntimeException("Mã lớp không được để trống");
        if (classRoom.getName() == null || classRoom.getName().isBlank())
            throw new RuntimeException("Tên lớp không được để trống");
        validateSemester(classRoom.getSemesterId());
        if (classRoomRepository.existsById(classRoom.getId()))
            throw new RuntimeException("Mã lớp đã tồn tại: " + classRoom.getId());
        if (classRoomRepository.existsByName(classRoom.getName()))
            throw new RuntimeException("Tên lớp đã tồn tại: " + classRoom.getName());
        return classRoomRepository.save(classRoom);
    }

    @Transactional
    public List<ClassRoom> createClassesBulk(List<ClassRoom> classes) {
        // Validate toàn bộ trước khi tạo bất kỳ record nào
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < classes.size(); i++) {
            ClassRoom c = classes.get(i);
            int row = i + 1;
            if (c.getId() == null || c.getId().isBlank()) {
                errors.add("Dòng " + row + ": Mã lớp không được để trống");
                continue;
            }
            if (c.getName() == null || c.getName().isBlank())
                errors.add("Dòng " + row + ": Tên lớp không được để trống");
            if (c.getSemesterId() == null)
                errors.add("Dòng " + row + ": Học kỳ không được để trống");
            else if (!semesterRepository.existsById(c.getSemesterId()))
                errors.add("Dòng " + row + ": Học kỳ '" + c.getSemesterId() + "' không tồn tại");
            if (classRoomRepository.existsById(c.getId()))
                errors.add("Dòng " + row + ": Mã lớp '" + c.getId() + "' đã tồn tại");
            if (c.getName() != null && classRoomRepository.existsByName(c.getName()))
                errors.add("Dòng " + row + ": Tên lớp '" + c.getName() + "' đã tồn tại");
        }
        if (!errors.isEmpty())
            throw new RuntimeException("Lỗi import:\n" + String.join("\n", errors));

        return classRoomRepository.saveAll(classes);
    }

    @Transactional
    public ClassRoom update(String id, ClassRoom updated) {
        ClassRoom existing = getById(id);
        validateSemester(updated.getSemesterId());
        long enrolledCount = studentRepository.countByClassId(existing.getId());

        if (updated.getMaxStudents() != null && updated.getMaxStudents() < enrolledCount) {
            throw new RuntimeException("Sĩ số tối đa (" + updated.getMaxStudents() + ") không được nhỏ hơn số lượng sinh viên hiện tại (" + enrolledCount + ")");
        }

        // Trường hợp đổi Mã lớp (ID)
        if (!id.equals(updated.getId())) {
            if (classRoomRepository.existsById(updated.getId()))
                throw new RuntimeException("Mã lớp mới '" + updated.getId() + "' đã tồn tại trong hệ thống.");

            // Cập nhật hàng loạt thay vì save từng record
            var students = studentRepository.findByClassId(id);
            students.forEach(s -> s.setClassId(updated.getId()));
            studentRepository.saveAll(students);

            var schedules = scheduleRepository.findByClassId(id);
            schedules.forEach(s -> s.setClassId(updated.getId()));
            scheduleRepository.saveAll(schedules);

            var records = attendanceRecordRepository.findByClassIdAndDateBetween(
                    id, LocalDate.of(2000, 1, 1), LocalDate.of(2100, 12, 31));
            records.forEach(r -> r.setClassId(updated.getId()));
            attendanceRecordRepository.saveAll(records);

            classRoomRepository.delete(existing);
            return classRoomRepository.save(updated);
        }

        // Trường hợp chỉ đổi tên hoặc mô tả
        if (!existing.getName().equals(updated.getName()) && classRoomRepository.existsByName(updated.getName()))
            throw new RuntimeException("Tên lớp '" + updated.getName() + "' đã tồn tại.");

        // Kiểm tra thay đổi subjectCode
        if (updated.getSubjectCode() != null && !updated.getSubjectCode().trim().isEmpty() &&
            !updated.getSubjectCode().equals(existing.getSubjectCode())) {
            
            // Tìm tất cả sinh viên của lớp này
            List<com.attendance.backend.entity.Student> students = studentRepository.findByClassId(existing.getId());
            
            String newCode = updated.getSubjectCode();
            String semesterKey = "UNSCHEDULED";
            List<com.attendance.backend.entity.Schedule> schedules = scheduleRepository.findByClassId(existing.getId());
            if (!schedules.isEmpty() && schedules.get(0).getSemesterId() != null) {
                semesterKey = String.valueOf(schedules.get(0).getSemesterId());
            }

            for (com.attendance.backend.entity.Student student : students) {
                // Kiểm tra xem sinh viên có học lớp khác cùng subjectCode trong cùng kỳ không
                for (ClassRoom otherClass : student.getClasses()) {
                    if (otherClass.getId().equals(existing.getId())) continue;
                    
                    if (newCode.equals(otherClass.getSubjectCode())) {
                        String otherSemesterKey = "UNSCHEDULED";
                        List<com.attendance.backend.entity.Schedule> otherSchedules = scheduleRepository.findByClassId(otherClass.getId());
                        if (!otherSchedules.isEmpty() && otherSchedules.get(0).getSemesterId() != null) {
                            otherSemesterKey = String.valueOf(otherSchedules.get(0).getSemesterId());
                        }
                        
                        if (semesterKey.equals(otherSemesterKey)) {
                            throw new RuntimeException("Thay đổi mã môn chuẩn gây xung đột: Sinh viên " + student.getId() + " đang học lớp " + otherClass.getId() + " có cùng mã môn chuẩn trong cùng học kỳ.");
                        }
                    }
                }
            }
        }

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setMaxStudents(updated.getMaxStudents());
        existing.setTotalSessions(updated.getTotalSessions());
        existing.setSubjectCode(updated.getSubjectCode());
        existing.setSemesterId(updated.getSemesterId());
        return classRoomRepository.save(existing);
    }

    @Transactional
    public void delete(String id) {
        getById(id);

        if (!scheduleRepository.findByClassId(id).isEmpty()) {
            throw new RuntimeException("Không thể xóa học phần đã được phân lịch dạy");
        }

        attendanceRecordRepository.deleteByClassId(id);

        // Gỡ liên kết lớp của học sinh (không xóa học sinh)
        var students = studentRepository.findByClassId(id);
        students.forEach(s -> s.setClassId(null));
        studentRepository.saveAll(students);

        classRoomRepository.deleteById(id);
    }

    private void validateSemester(Long semesterId) {
        if (semesterId == null)
            throw new RuntimeException("Học kỳ không được để trống");
        if (!semesterRepository.existsById(semesterId))
            throw new RuntimeException("Học kỳ không tồn tại: " + semesterId);
    }
}
