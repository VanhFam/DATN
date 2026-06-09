package com.attendance.backend.repository;

import com.attendance.backend.entity.ClassRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClassRoomRepository extends JpaRepository<ClassRoom, String> {
    Optional<ClassRoom> findByName(String name);
    boolean existsByName(String name);

    @org.springframework.data.jpa.repository.Query("""
            SELECT c FROM ClassRoom c
            WHERE :search IS NULL OR :search = ''
               OR LOWER(c.id) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<ClassRoom> search(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);
}
