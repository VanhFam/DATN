package com.attendance.backend.service;

import com.attendance.backend.entity.Semester;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.SemesterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SemesterService {

    private final SemesterRepository semesterRepository;

    public SemesterService(SemesterRepository semesterRepository) {
        this.semesterRepository = semesterRepository;
    }

    public List<Semester> getAllSemesters() {
        return semesterRepository.findAll();
    }

    public Semester getById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ: " + id));
    }

    public Semester getActiveSemester() {
        return semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có học kỳ đang hoạt động"));
    }

    @Transactional
    public Semester create(Semester semester) {
        semester.setIsActive(false);
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester update(Long id, Semester updated) {
        Semester semester = getById(id);
        semester.setName(updated.getName());
        semester.setStartDate(updated.getStartDate());
        semester.setEndDate(updated.getEndDate());
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester setActive(Long id) {
        // Deactivate current active semester
        semesterRepository.findByIsActiveTrue().ifPresent(current -> {
            current.setIsActive(false);
            semesterRepository.save(current);
        });
        Semester semester = getById(id);
        semester.setIsActive(true);
        return semesterRepository.save(semester);
    }

    @Transactional
    public void delete(Long id) {
        Semester semester = getById(id);
        if (semester.getIsActive()) {
            throw new RuntimeException("Không thể xóa học kỳ đang hoạt động");
        }
        semesterRepository.deleteById(id);
    }
}
