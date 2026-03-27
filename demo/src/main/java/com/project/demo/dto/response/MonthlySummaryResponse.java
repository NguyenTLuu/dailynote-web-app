package com.project.demo.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class MonthlySummaryResponse {
    private String month;

    private Integer totalNotes;
    private Double averageRate;

    private Map<String, Long> tagCounts;
}