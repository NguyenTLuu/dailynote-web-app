package com.project.demo.repository;

import com.project.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA tự động dịch tên hàm này thành:
    // SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Kiểm tra xem email đã tồn tại chưa (dùng khi đăng ký)
    boolean existsByEmail(String email);
}