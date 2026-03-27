package com.project.demo.dto.request;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String idToken; // Đoạn mã mà Google trả về cho Next.js
}