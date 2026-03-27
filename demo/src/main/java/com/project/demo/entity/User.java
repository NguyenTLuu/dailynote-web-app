package com.project.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    // Khai báo Enum chức vụ ngay trong này cho gọn
    public enum Role {
        USER, ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    // Thêm trường role
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER; // Mặc định ai đăng ký cũng là dân thường (USER)
}