package com.project.demo.dto.request;
import lombok.Data;

@Data
public class TagRequest {
    private String name;       // Tên: Cười tủm tỉm, Vợ yêu, Nhậu...
    private String category;   // Category: EMOTION, PEOPLE... (Nếu gõ tên mới, DB sẽ tự ghi nhận category mới)
    private String emoji;      // Icon: 🤭, 👩‍❤️‍👨, 🍻
}