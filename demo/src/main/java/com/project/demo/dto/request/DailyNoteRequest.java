package com.project.demo.dto.request;


import lombok.Data;
import java.time.LocalDate;
import java.util.Set;

@Data
public class DailyNoteRequest {
    private LocalDate recordDate;
    private Integer rate;
    private String noteText;
    private Set<Long> tagIds; // Chỉ gửi ID của các tag (emotions, weather...)
}

