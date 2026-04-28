package com.attendance.backend.repository;

import com.attendance.backend.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    @Query("SELECT a FROM AttendanceRecord a WHERE LOWER(a.classId) = LOWER(:classId) AND a.date = :date " +
           "AND a.studentId IN (SELECT s.id FROM Student s JOIN s.classes c WHERE LOWER(c.id) = LOWER(:classId))")
    List<AttendanceRecord> findValidRecordsByClassAndDate(@Param("classId") String classId, @Param("date") LocalDate date);

    @Query("SELECT a FROM AttendanceRecord a WHERE LOWER(TRIM(a.classId)) = LOWER(TRIM(:classId)) AND a.date BETWEEN :from AND :to")
    List<AttendanceRecord> findValidRecordsByClassAndDateRange(@Param("classId") String classId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    List<AttendanceRecord> findByStudentIdAndDateBetween(String studentId, LocalDate from, LocalDate to);

    List<AttendanceRecord> findByClassIdAndDateBetween(String classId, LocalDate from, LocalDate to);

    Optional<AttendanceRecord> findByStudentIdAndDateAndClassIdAndScheduleId(String studentId, LocalDate date, String classId, String scheduleId);

    List<AttendanceRecord> findByStudentIdAndDate(String studentId, LocalDate date);

    long countByDateAndStatus(LocalDate date, AttendanceRecord.AttendanceStatus status);

    long countByDate(LocalDate date);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.date BETWEEN :from AND :to AND a.status = :status")
    long countByDateRangeAndStatus(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("status") AttendanceRecord.AttendanceStatus status);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.date BETWEEN :from AND :to")
    long countByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    List<AttendanceRecord> findTop10ByDateOrderByCheckInTimeDesc(LocalDate date);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.classId IN :classIds AND a.date = :date ORDER BY a.checkInTime DESC")
    List<AttendanceRecord> findTopByClassIdInAndDateOrderByCheckInTimeDesc(@Param("classIds") java.util.List<String> classIds, @Param("date") LocalDate date, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.studentId = :studentId AND a.status = :status AND a.date BETWEEN :from AND :to")
    long countByStatusAndStudentAndDateRange(@Param("studentId") String studentId,
                                           @Param("status") AttendanceRecord.AttendanceStatus status,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.studentId = :studentId AND a.date BETWEEN :from AND :to")
    long countTotalByStudentAndDateRange(@Param("studentId") String studentId,
                                         @Param("from") LocalDate from,
                                         @Param("to") LocalDate to);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AttendanceRecord a WHERE a.classId = :classId")
    void deleteByClassId(@org.springframework.data.repository.query.Param("classId") String classId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AttendanceRecord a WHERE a.studentId = :studentId")
    void deleteByStudentId(@org.springframework.data.repository.query.Param("studentId") String studentId);
}
