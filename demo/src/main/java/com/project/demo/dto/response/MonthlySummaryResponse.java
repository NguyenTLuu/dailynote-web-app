package com.project.demo.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder // Dùng Builder để Service dễ dàng tạo object này trả về
public class MonthlySummaryResponse {
    private String month; // Định dạng "YYYY-MM", ví dụ: "2026-03"

    private Integer totalNotes; // Tổng số ngày đã viết nhật ký trong tháng
    private Double averageRate; // Điểm trung bình của tháng (ví dụ: 4.2)

    // Thống kê đếm số lượng tag để vẽ Pie Chart / Bar Chart
    // Ví dụ trả về dạng JSON: { "Vui vẻ": 15, "Buồn bã": 2, "Trời mưa": 5 }
    private Map<String, Long> tagCounts;
}