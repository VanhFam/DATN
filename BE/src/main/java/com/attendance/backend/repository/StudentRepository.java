package com.attendance.backend.repository;

import com.attendance.backend.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    @Query("SELECT s FROM Student s JOIN s.classes c WHERE c.id = :classId")
    List<Student> findByClassId(@Param("classId") String classId);

    @Query("SELECT COUNT(s) FROM Student s JOIN s.classes c WHERE c.id = :classId")
    long countByClassId(@Param("classId") String classId);

    @Query("SELECT COUNT(s) FROM Student s JOIN s.classes c WHERE c.id = :classId AND s.isActive = :isActive")
    long countByClassIdAndIsActive(@Param("classId") String classId, @Param("isActive") Boolean isActive);
    
    List<Student> findByIsActive(Boolean isActive);
    
    @Query("SELECT s FROM Student s JOIN s.classes c WHERE c.id = :classId AND s.isActive = :isActive")
    List<Student> findByClassIdAndIsActive(@Param("classId") String classId, @Param("isActive") Boolean isActive);
    
    Optional<Student> findByUserId(Long userId);

    @Query("SELECT s FROM Student s JOIN s.user u WHERE u.username = :username")
    Optional<Student> findByUsername(@Param("username") String username);

    @Query("SELECT DISTINCT s FROM Student s JOIN s.classes c WHERE c.id IN :classIds")
    List<Student> findByClassIds(@Param("classIds") java.util.List<String> classIds);

    @Query("SELECT COUNT(DISTINCT s) FROM Student s JOIN s.classes c WHERE c.id IN :classIds")
    long countByClassIds(@Param("classIds") java.util.List<String> classIds);

    // Fallback: tìm sinh viên qua bản ghi điểm danh khi student_classes chưa được cấu hình
    @Query("SELECT DISTINCT s FROM Student s WHERE s.id IN (SELECT a.studentId FROM AttendanceRecord a WHERE a.classId IN :classIds)")
    List<Student> findByAttendanceClassIds(@Param("classIds") java.util.List<String> classIds);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @Query("SELECT DISTINCT s FROM Student s LEFT JOIN FETCH s.classes")
    List<Student> findAllWithClasses();

    @Query(
            value = """
                    SELECT DISTINCT s FROM Student s
                    LEFT JOIN FETCH s.classes c
                    WHERE :search IS NULL OR :search = ''
                       OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    """,
            countQuery = """
                    SELECT COUNT(DISTINCT s) FROM Student s
                    WHERE :search IS NULL OR :search = ''
                       OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    """
    )
    Page<Student> searchAllWithClasses(@Param("search") String search, Pageable pageable);

    @Query(
            value = """
                    SELECT DISTINCT s FROM Student s
                    JOIN FETCH s.classes c
                    WHERE c.id IN :classIds
                      AND (:search IS NULL OR :search = ''
                       OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                    """,
            countQuery = """
                    SELECT COUNT(DISTINCT s) FROM Student s
                    JOIN s.classes c
                    WHERE c.id IN :classIds
                      AND (:search IS NULL OR :search = ''
                       OR LOWER(s.id) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                       OR LOWER(COALESCE(s.phone, '')) LIKE LOWER(CONCAT('%', :search, '%')))
                    """
    )
    Page<Student> searchByClassIdsWithClasses(@Param("classIds") java.util.List<String> classIds,
                                              @Param("search") String search,
                                              Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.faceEmbedding IS NOT NULL AND s.faceEmbedding != ''")
    List<Student> findAllWithFaceEmbedding();
}
