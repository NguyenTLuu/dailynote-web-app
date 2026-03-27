package com.project.demo.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class DailyNoteResponse {
    private Long id;
    private LocalDate recordDate;
    private Integer rate;
    private String noteText;
    private String aiAdvice;
    private Set<TagDto> tags;

    @Data
    public static class TagDto {
        private String name;
        private String category;
        private String emoji;
    }
}