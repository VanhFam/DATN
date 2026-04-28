package com.attendance.backend.service;

import com.attendance.backend.entity.ClassRoom;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.AttendanceRecordRepository;
import com.attendance.backend.repository.ClassRoomRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.repository.StudentRepository;
import com.attendance.backend.repository.TeacherRepository;
import com.attendance.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;

    public ClassRoomService(ClassRoomRepository classRoomRepository, 
                            AttendanceRecordRepository attendanceRecordRepository,
                            ScheduleRepository scheduleRepository,
                            StudentRepository studentRepository,
                            UserRepository userRepository,
                            TeacherRepository teacherRepository) {
        this.classRoomRepository = classRoomRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.scheduleRepository = scheduleRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
    }

    public List<ClassRoom> getAllClasses() {
        return classRoomRepository.findAll();
    }

    public ClassRoom getById(String id) {
        return classRoomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp: " + id));
    }

    @Transactional
    public ClassRoom create(ClassRoom classRoom) {
        if (classRoomRepository.existsById(classRoom.getId())) {
            throw new RuntimeException("Mã lớp đã tồn tại: " + classRoom.getId());
        }
        if (classRoomRepository.existsByName(classRoom.getName())) {
            throw new RuntimeException("Tên lớp đã tồn tại: " + classRoom.getName());
        }
        return classRoomRepository.save(classRoom);
    }

    @Transactional
    public ClassRoom update(String id, ClassRoom updated) {
        ClassRoom existing = getById(id);
        
        // Trường hợp đổi Mã lớp (ID)
        if (!id.equals(updated.getId())) {
            if (classRoomRepository.existsById(updated.getId())) {
                throw new RuntimeException("Mã lớp mới '" + updated.getId() + "' đã tồn tại trong hệ thống.");
            }

            // 1. Cập nhật mã lớp cho Học sinh
            studentRepository.findByClassId(id).forEach(s -> {
                s.setClassId(updated.getId());
                studentRepository.save(s);
            });

            // 2. Cập nhật mã lớp cho Lịch dạy
            scheduleRepository.findByClassId(id).forEach(s -> {
                s.setClassId(updated.getId());
                scheduleRepository.save(s);
            });



            // 4. Cập nhật mã lớp cho Bản ghi điểm danh (tra cứu diện rộng)
            attendanceRecordRepository.findByClassIdAndDateBetween(id, LocalDate.of(2000,1,1), LocalDate.of(2100,12,31))
                .forEach(r -> {
                    r.setClassId(updated.getId());
                    attendanceRecordRepository.save(r);
                });

            // 5. Xóa lớp cũ và tạo lớp mới với thông tin mới
            classRoomRepository.delete(existing);
            return classRoomRepository.save(updated);
        }

        // Trường hợp chỉ đổi tên hoặc mô tả
        if (!existing.getName().equals(updated.getName()) && classRoomRepository.existsByName(updated.getName())) {
            throw new RuntimeException("Tên lớp '" + updated.getName() + "' đã tồn tại.");
        }

        System.out.println(">>> Updating Class: " + id + ", Max Students: " + updated.getMaxStudents());
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setMaxStudents(updated.getMaxStudents());
        ClassRoom saved = classRoomRepository.save(existing);
        System.out.println(">>> Saved Class Max Students: " + saved.getMaxStudents());
        return saved;
    }

    @Transactional
    public void delete(String id) {
        ClassRoom classRoom = getById(id);
        
        // 1. Xóa dữ liệu điểm danh của lớp
        List<com.attendance.backend.entity.AttendanceRecord> records = attendanceRecordRepository.findByClassIdAndDateBetween(id, LocalDate.of(2000, 1, 1), LocalDate.of(2100, 12, 31));
        attendanceRecordRepository.deleteAll(records);
        
        // 2. Xóa lịch học của lớp
        List<com.attendance.backend.entity.Schedule> schedules = scheduleRepository.findByClassId(id);
        scheduleRepository.deleteAll(schedules);
        
        // 3. Gỡ bỏ liên kết lớp của học sinh (không xóa học sinh)
        List<com.attendance.backend.entity.Student> students = studentRepository.findByClassId(id);
        for (com.attendance.backend.entity.Student student : students) {
            student.setClassId(null);
            studentRepository.save(student);
        }
        
        // 4. Xóa lớp học
        classRoomRepository.delete(classRoom);
    }
}
