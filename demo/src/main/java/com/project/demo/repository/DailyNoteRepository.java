package com.project.demo.repository;

import com.project.demo.entity.DailyNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyNoteRepository extends JpaRepository<DailyNote, Long> {

    Optional<DailyNote> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    List<DailyNote> findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("SELECT AVG(d.rate) FROM DailyNote d WHERE d.user.id = :userId " +
            "AND d.recordDate >= :startDate AND d.recordDate <= :endDate")
    Double getAverageRateByDateRange(@Param("userId") Long userId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(d) FROM DailyNote d WHERE d.user.id = :userId " +
            "AND d.recordDate >= :startDate AND d.recordDate <= :endDate")
    Integer countNotesByDateRange(@Param("userId") Long userId,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}