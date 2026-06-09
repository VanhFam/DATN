package com.attendance.backend.repository;

import com.attendance.backend.entity.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findByClassId(String classId);
    List<Schedule> findByTeacherIdIgnoreCase(String teacherId);
    List<Schedule> findByClassIdAndDayOfWeek(String classId, String dayOfWeek);
    List<Schedule> findByTeacherIdAndDayOfWeek(String teacherId, String dayOfWeek);
    List<Schedule> findByRoomIgnoreCaseAndDayOfWeek(String room, String dayOfWeek);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Schedule s WHERE s.classId = :classId")
    void deleteByClassId(@org.springframework.data.repository.query.Param("classId") String classId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Schedule s WHERE s.teacherId = :teacherId")
    void deleteByTeacherId(@org.springframework.data.repository.query.Param("teacherId") String teacherId);

    List<Schedule> findByLocationId(String locationId);

    @org.springframework.data.jpa.repository.Query("""
            SELECT s FROM Schedule s
            WHERE (:semesterId IS NULL OR s.semesterId = :semesterId)
              AND (:search IS NULL OR :search = ''
               OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.subject) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.classId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.teacherId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(s.teacherName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(s.room, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Schedule> search(@org.springframework.data.repository.query.Param("search") String search,
                          @org.springframework.data.repository.query.Param("semesterId") Long semesterId,
                          Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT s FROM Schedule s
            WHERE LOWER(s.teacherId) = LOWER(:teacherId)
              AND (:semesterId IS NULL OR s.semesterId = :semesterId)
              AND (:search IS NULL OR :search = ''
               OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.subject) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(s.classId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(s.room, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Schedule> searchByTeacher(@org.springframework.data.repository.query.Param("teacherId") String teacherId,
                                   @org.springframework.data.repository.query.Param("search") String search,
                                   @org.springframework.data.repository.query.Param("semesterId") Long semesterId,
                                   Pageable pageable);
}
