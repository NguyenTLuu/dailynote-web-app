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

    // 1. Tìm 1 note cụ thể của 1 user (Đảm bảo người dùng không xem trộm note của người khác)
    Optional<DailyNote> findByIdAndUserId(Long id, Long userId);

    // 2. Kiểm tra xem user này đã viết nhật ký cho ngày hôm nay chưa
    boolean existsByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    // 3. Lấy toàn bộ note của 1 user trong 1 khoảng thời gian (Dùng cho Calendar View)
    // Sắp xếp tăng dần theo ngày (OrderByRecordDateAsc)
    List<DailyNote> findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    // 4. THỐNG KÊ: Tính điểm rate trung bình trong 1 tháng bằng JPQL
    @Query("SELECT AVG(d.rate) FROM DailyNote d WHERE d.user.id = :userId " +
            "AND d.recordDate >= :startDate AND d.recordDate <= :endDate")
    Double getAverageRateByDateRange(@Param("userId") Long userId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    // 5. THỐNG KÊ: Đếm tổng số ngày đã viết nhật ký trong 1 tháng
    @Query("SELECT COUNT(d) FROM DailyNote d WHERE d.user.id = :userId " +
            "AND d.recordDate >= :startDate AND d.recordDate <= :endDate")
    Integer countNotesByDateRange(@Param("userId") Long userId,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}