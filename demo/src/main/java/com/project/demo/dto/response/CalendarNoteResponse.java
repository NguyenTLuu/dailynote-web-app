package com.project.demo.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CalendarNoteResponse {
    private Long id;
    private LocalDate recordDate;
    private Integer rate;

    private List<String> emojis;
}