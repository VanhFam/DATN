package com.attendance.backend.repository;

import com.attendance.backend.entity.ClassRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClassRoomRepository extends JpaRepository<ClassRoom, String> {
    Optional<ClassRoom> findByName(String name);
    boolean existsByName(String name);
}
