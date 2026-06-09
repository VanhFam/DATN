package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.entity.Semester;
import com.attendance.backend.exception.ResourceNotFoundException;
import com.attendance.backend.repository.SemesterRepository;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    public PaginatedResponse<Semester> getSemestersPage(String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("startDate").descending());
        return PaginationUtils.fromPage(semesterRepository.search(search, pageable));
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
        validateSemester(semester, null);
        semester.setIsActive(false);
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester update(Long id, Semester updated) {
        Semester semester = getById(id);
        validateSemester(updated, id);
        semester.setName(updated.getName());
        semester.setStartDate(updated.getStartDate());
        semester.setEndDate(updated.getEndDate());
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester setActive(Long id) {
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
        if (semester.getIsActive())
            throw new RuntimeException("Không thể xóa học kỳ đang hoạt động");
        semesterRepository.deleteById(id);
    }

    private void validateSemester(Semester semester, Long excludeId) {
        if (semester.getName() == null || semester.getName().isBlank())
            throw new RuntimeException("Tên học kỳ không được để trống");
        if (semester.getStartDate() == null)
            throw new RuntimeException("Ngày bắt đầu không được để trống");
        if (semester.getEndDate() == null)
            throw new RuntimeException("Ngày kết thúc không được để trống");
        if (!semester.getStartDate().isBefore(semester.getEndDate()))
            throw new RuntimeException("Ngày bắt đầu phải trước ngày kết thúc");

        // Kiểm tra tên trùng (bỏ qua chính học kỳ đang update)
        boolean nameTaken = semesterRepository.findAll().stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase(semester.getName().trim())
                        && !s.getId().equals(excludeId));
        if (nameTaken)
            throw new RuntimeException("Tên học kỳ đã tồn tại: " + semester.getName());
    }
}
