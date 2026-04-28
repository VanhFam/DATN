package com.attendance.backend.repository;

import com.attendance.backend.entity.Teacher;
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
}
