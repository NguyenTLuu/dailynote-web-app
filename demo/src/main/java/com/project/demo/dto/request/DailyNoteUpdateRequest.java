package com.project.demo.dto.request;

import lombok.Data;
import java.util.Set;

@Data
public class DailyNoteUpdateRequest {
    private Integer rate; // Cập nhật lại điểm số 1-5
    private String noteText; // Sửa lại nội dung text
    private Set<Long> tagIds; // Danh sách ID của các icon/tag mới
}