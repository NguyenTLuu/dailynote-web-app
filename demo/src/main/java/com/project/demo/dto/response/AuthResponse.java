package com.project.demo.dto.response;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token; // JWT Token để Next.js lưu vào LocalStorage/Cookie
    private Long userId;
    private String username;
    private String email;
}