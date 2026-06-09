package com.attendance.backend.repository;

import com.attendance.backend.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByEmail(String email);
    Optional<Teacher> findByUserId(Long userId);
    List<Teacher> findByIsActive(Boolean isActive);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Teacher t LEFT JOIN t.user u WHERE t.id = :idOrUsername OR u.username = :idOrUsername")
    java.util.Optional<Teacher> findByUsernameOrId(@org.springframework.data.repository.query.Param("idOrUsername") String idOrUsername);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @org.springframework.data.jpa.repository.Query("""
            SELECT t FROM Teacher t
            WHERE :search IS NULL OR :search = ''
               OR LOWER(t.id) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(t.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(t.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<Teacher> search(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);
}
