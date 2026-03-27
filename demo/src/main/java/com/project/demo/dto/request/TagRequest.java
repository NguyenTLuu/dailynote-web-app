package com.project.demo.dto.request;
import lombok.Data;

@Data
public class TagRequest {
    private String name;
    private String category;
    private String emoji;
}