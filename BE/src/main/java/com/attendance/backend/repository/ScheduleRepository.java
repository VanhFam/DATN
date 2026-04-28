package com.attendance.backend.repository;

import com.attendance.backend.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findByClassId(String classId);
    List<Schedule> findByTeacherIdIgnoreCase(String teacherId);
    List<Schedule> findByClassIdAndDayOfWeek(String classId, String dayOfWeek);
    List<Schedule> findByTeacherIdAndDayOfWeek(String teacherId, String dayOfWeek);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Schedule s WHERE s.classId = :classId")
    void deleteByClassId(@org.springframework.data.repository.query.Param("classId") String classId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Schedule s WHERE s.teacherId = :teacherId")
    void deleteByTeacherId(@org.springframework.data.repository.query.Param("teacherId") String teacherId);
}
