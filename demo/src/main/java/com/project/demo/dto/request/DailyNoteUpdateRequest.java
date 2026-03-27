package com.project.demo.dto.request;

import lombok.Data;
import java.util.Set;

@Data
public class DailyNoteUpdateRequest {
    private Integer rate;
    private String noteText;
    private Set<Long> tagIds;
}