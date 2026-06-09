package com.attendance.backend.repository;

import com.attendance.backend.entity.Location;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    List<Location> findByIsActive(Boolean isActive);

    @org.springframework.data.jpa.repository.Query("""
            SELECT l FROM Location l
            WHERE :search IS NULL OR :search = ''
               OR LOWER(l.id) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(l.address, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            """)
    Page<Location> search(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);
}
