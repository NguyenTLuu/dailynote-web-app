package com.project.demo.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CalendarNoteResponse {
    private Long id;
    private LocalDate recordDate;
    private Integer rate;

    // Chỉ trả về một mảng chứa các biểu tượng (vd: ["😄", "☀️", "🎮"])
    // để Next.js render thẳng lên ô lịch cho nhẹ.
    private List<String> emojis;
}