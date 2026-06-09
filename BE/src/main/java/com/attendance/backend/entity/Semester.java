package com.attendance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "semesters")
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean isActive = false;

    public Semester() {
    }

    public Semester(Long id, String name, LocalDate startDate, LocalDate endDate, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isActive = isActive;
    }

    public static SemesterBuilder builder() {
        return new SemesterBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static class SemesterBuilder {
        private Long id;
        private String name;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isActive = false;

        SemesterBuilder() {
        }

        public SemesterBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SemesterBuilder name(String name) {
            this.name = name;
            return this;
        }

        public SemesterBuilder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public SemesterBuilder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public SemesterBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Semester build() {
            return new Semester(id, name, startDate, endDate, isActive);
        }
    }
}
