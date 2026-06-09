package com.attendance.backend.repository;

import com.attendance.backend.entity.Semester;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByIsActiveTrue();
    boolean existsByName(String name);

    @org.springframework.data.jpa.repository.Query("""
            SELECT s FROM Semester s
            WHERE :search IS NULL OR :search = ''
               OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<Semester> search(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);
}
